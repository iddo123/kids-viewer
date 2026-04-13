import { useState, useEffect, useRef } from 'react'

// ─── Singleton model — loaded once, reused for every video ───────────────────
let modelPromise = null

export async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      console.log('[detection] loading TF.js + COCO-SSD…')
      await import('@tensorflow/tfjs')
      const cocoSsd = await import('@tensorflow-models/coco-ssd')
      const model = await cocoSsd.load({ base: 'mobilenet_v2' })
      console.log('[detection] model ready')
      return model
    })()
  }
  return modelPromise
}

// ─── Shared constants (also used by useScreenDetection) ──────────────────────
// Excluded: 'tv' and 'laptop' — both produce many false positives on
// bright/colorful video thumbnails that look like screens to the model.
export const INTERESTING = new Set([
  // People
  'person',
  // Animals
  'bird','cat','dog','horse','sheep','cow','elephant','bear','zebra','giraffe',
  // Vehicles
  'bicycle','car','motorcycle','airplane','bus','train','truck','boat',
  // Food
  'banana','apple','sandwich','orange','broccoli','carrot',
  'hot dog','pizza','donut','cake',
  // Kitchen / tableware
  'bottle','cup','fork','knife','spoon','bowl',
  // Furniture / indoor
  'chair','couch','bed','clock','book','vase',
  // Toys / sports
  'teddy bear','sports ball','kite','baseball bat','skateboard','tennis racket',
  // Other everyday objects
  'backpack','umbrella','cell phone','refrigerator','sink',
  'scissors','toothbrush','potted plant','remote',
])

// COCO labels → simpler kid-friendly teaching word
export const LABEL_REMAP = {
  'sports ball':  'ball',
  'hot dog':      'sausage',
  'potted plant': 'plant',
  'cell phone':   'phone',
  'teddy bear':   'teddy',
  'wine glass':   'glass',
  'hair drier':   'dryer',
  'person':       'person',
}

// Only scan the three timestamped frames — each maps to a known position in
// the video (25 / 50 / 75 %) so challenges fire at the right moment with
// the matching image.
function getFrameUrls(videoId) {
  return [
    `https://img.youtube.com/vi/${videoId}/1.jpg`,  // 120×90 at ~25%
    `https://img.youtube.com/vi/${videoId}/2.jpg`,  // 120×90 at ~50%
    `https://img.youtube.com/vi/${videoId}/3.jpg`,  // 120×90 at ~75%
  ]
}

// ─── Hook — incremental: state updates after each frame ──────────────────────
export function useObjectDetection(videoId) {
  const [objects, setObjects] = useState([])
  const [status, setStatus]   = useState('idle')
  const detectedForRef        = useRef(null)
  const objectsRef            = useRef([])

  useEffect(() => {
    if (!videoId) return
    if (detectedForRef.current === videoId) return
    detectedForRef.current = videoId
    objectsRef.current = []

    setObjects([])
    setStatus('loading')

    const seen = new Set()

    function onFound(obj) {
      if (seen.has(obj.label)) return
      seen.add(obj.label)
      objectsRef.current = [...objectsRef.current, obj]
      setObjects([...objectsRef.current])
      setStatus('ready')   // ready as soon as the first object is found

      const frameName = obj.frameUrl.split('/').pop().split('?')[0]
      const timeHint  = { 'sddefault.jpg': 'main thumbnail',
                          'maxresdefault.jpg': 'main thumbnail',
                          'hqdefault.jpg': 'main thumbnail',
                          '1.jpg': '~25% through video',
                          '2.jpg': '~50% through video',
                          '3.jpg': '~75% through video' }[frameName] ?? frameName

      // Log text info
      console.log(`[detection] ✓ ${obj.label}  |  ${timeHint}  |  bbox: [${obj.bbox.map(Math.round).join(', ')}]`)

      // Show the actual frame image inline in the console
      const imgW = Math.min(obj.frameWidth,  320)
      const imgH = Math.round(imgW * obj.frameHeight / obj.frameWidth)
      console.log(
        '%c ',
        `display:block;` +
        `background:url("${obj.frameUrl}") no-repeat top left/contain;` +
        `padding:${imgH / 2}px ${imgW / 2}px;` +
        `border:2px solid orange;` +
        `font-size:0`
      )
    }

    runDetection(videoId, onFound)
      .then(() => {
        if (objectsRef.current.length === 0) {
          console.log('[detection] no interesting objects found in any frame')
          setStatus('unavailable')
        } else {
          console.log(`[detection] ── summary: ${objectsRef.current.map(o => o.label).join(', ')} ──`)
        }
      })
      .catch(err => {
        console.warn('[detection] failed:', err.message)
        setStatus('unavailable')
      })
  }, [videoId])

  useEffect(() => {
    if (!videoId) {
      setObjects([])
      setStatus('idle')
      detectedForRef.current = null
      objectsRef.current = []
    }
  }, [videoId])

  return { objects, status }
}

// ─── Run COCO-SSD across thumbnails + storyboard frames ──────────────────────
async function runDetection(videoId, onFound) {
  const model = await getModel()

  // Phase 1: standard YouTube thumbnails (fast, available immediately)
  for (const url of getFrameUrls(videoId)) {
    try {
      const img = await loadImage(url)
      await scanImage(model, img, img.naturalWidth, img.naturalHeight, url, onFound)
    } catch (e) {
      console.warn(`[detection] thumbnail skipped (${url.split('/').pop()}):`, e.message)
    }
  }

}

const MIN_BBOX_AREA_PCT = 0.05   // object must cover ≥5% of the frame

// Classes that produce many false positives on video cover art / thumbnails.
// These need a much higher confidence bar.
const HIGH_FP_CLASSES = new Set([
  // Small / easily confused objects
  'cell phone', 'remote', 'book', 'clock', 'vase',
  'scissors', 'toothbrush', 'knife', 'fork', 'spoon', 'bowl', 'cup', 'bottle',
  // Food — very commonly misdetected on colourful thumbnails
  'cake', 'pizza', 'donut', 'sandwich', 'hot dog', 'banana', 'apple',
  'orange', 'broccoli', 'carrot',
])

async function scanImage(model, source, frameW, frameH, frameUrl, onFound) {
  const predictions = await model.detect(source)
  for (const { class: cls, score, bbox } of predictions) {
    const threshold = HIGH_FP_CLASSES.has(cls) ? 0.80 : 0.50
    if (score < threshold)     continue
    if (!INTERESTING.has(cls)) continue
    // Reject tiny detections — bbox area < 5% of frame
    const bboxAreaPct = (bbox[2] * bbox[3]) / (frameW * frameH)
    if (bboxAreaPct < MIN_BBOX_AREA_PCT) continue
    const label = LABEL_REMAP[cls] ?? cls

    // For canvas frames, convert to a data URL so WordChallenge can display it
    const url = source instanceof HTMLCanvasElement
      ? source.toDataURL('image/jpeg', 0.85)
      : frameUrl

    // Timestamp hint: which fraction of the video this frame came from
    const frameName = frameUrl.split('/').pop().split('?')[0]
    const timestampPct = { '1.jpg': 0.25, '2.jpg': 0.50, '3.jpg': 0.75 }[frameName] ?? null

    onFound({ label, bbox, frameUrl: url, frameWidth: frameW, frameHeight: frameH, timestampPct })
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img        = new Image()
    img.crossOrigin  = 'anonymous'
    img.onload       = () => resolve(img)
    img.onerror      = () => reject(new Error(`Failed to load ${url}`))
    img.src          = url
  })
}
