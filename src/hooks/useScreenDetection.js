import { useState, useRef, useCallback, useEffect } from 'react'
import { getModel, INTERESTING, LABEL_REMAP } from './useObjectDetection'

const SCAN_INTERVAL_MS = 4000   // scan a new frame every 4 seconds

/**
 * Live screen-capture detection.
 *
 * Call startCapture() from a button click (user gesture required).
 * Pass playerContainerRef so the hook knows where to crop.
 * onObjectFound(obj) is called each time a NEW object is spotted.
 *
 * status: 'idle' | 'requesting' | 'active' | 'denied' | 'error'
 */
export function useScreenDetection({ playerContainerRef, onObjectFound, isPausedRef }) {
  const [status, setStatus] = useState('idle')

  const streamRef   = useRef(null)
  const captureRef  = useRef(null)   // hidden <video> element fed by screen stream
  const intervalRef = useRef(null)
  const seenRef     = useRef(new Set())

  // ── Start capture — must be triggered directly by a user gesture ──────────
  const startCapture = useCallback(async () => {
    try {
      setStatus('requesting')

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 5, max: 10 } },
        audio: false,
      })

      // Auto-stop if the user ends sharing from the browser bar
      stream.getVideoTracks()[0].addEventListener('ended', () => stopCapture())

      const vid = document.createElement('video')
      vid.srcObject = stream
      vid.muted     = true
      await vid.play()

      streamRef.current  = stream
      captureRef.current = vid
      seenRef.current    = new Set()

      setStatus('active')
      console.log('[screen] capture started')

      // Start scanning
      intervalRef.current = setInterval(scanFrame, SCAN_INTERVAL_MS)
      // First scan after a short delay so the video player has time to mount
      setTimeout(scanFrame, 1500)

    } catch (err) {
      console.warn('[screen] capture failed:', err.message)
      setStatus(err.name === 'NotAllowedError' ? 'denied' : 'error')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopCapture = useCallback(() => {
    clearInterval(intervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current  = null
    captureRef.current = null
    setStatus('idle')
  }, [])

  // Clean up on unmount
  useEffect(() => () => stopCapture(), []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scan one frame ────────────────────────────────────────────────────────
  async function scanFrame() {
    const vid       = captureRef.current
    const container = playerContainerRef?.current
    if (!vid || !container || vid.readyState < 2) return

    // Don't scan while a challenge is already showing
    if (isPausedRef?.current) return

    try {
      const model = await getModel()
      const rect  = container.getBoundingClientRect()
      const dpr   = window.devicePixelRatio || 1

      const sw = rect.width  * dpr
      const sh = rect.height * dpr
      const sx = rect.left   * dpr
      const sy = rect.top    * dpr

      // Guard: player rect must fit within the captured stream
      const streamW = vid.videoWidth
      const streamH = vid.videoHeight
      if (sw <= 0 || sh <= 0 || sx < 0 || sy < 0 || sx + sw > streamW + 4 || sy + sh > streamH + 4) {
        console.warn('[screen] player rect outside stream — skipping frame')
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(sw)
      canvas.height = Math.round(sh)
      canvas.getContext('2d').drawImage(vid, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

      const predictions = await model.detect(canvas)

      // Classes that COCO-SSD frequently misdetects on screen-captured video frames.
      // They need a much higher confidence bar before we trust them.
      const HIGH_FP_CLASSES = new Set([
        'cell phone', 'remote', 'book', 'clock', 'vase',
        'scissors', 'toothbrush', 'knife', 'fork', 'spoon',
      ])
      const MIN_BBOX_AREA_PCT  = 0.05   // object must cover ≥5% of frame
      const SCORE_NORMAL       = 0.65   // raised threshold for live frames (noisier than stills)
      const SCORE_HIGH_FP      = 0.85   // extra strict for unreliable classes

      for (const { class: cls, score, bbox } of predictions) {
        const threshold = HIGH_FP_CLASSES.has(cls) ? SCORE_HIGH_FP : SCORE_NORMAL
        if (score < threshold)     continue
        if (!INTERESTING.has(cls)) continue
        const bboxAreaPct = (bbox[2] * bbox[3]) / (canvas.width * canvas.height)
        if (bboxAreaPct < MIN_BBOX_AREA_PCT) continue
        const label = LABEL_REMAP[cls] ?? cls
        if (seenRef.current.has(label)) continue

        seenRef.current.add(label)
        const frameUrl = canvas.toDataURL('image/jpeg', 0.85)
        console.log(`[screen] ✓ ${label}  score=${score.toFixed(2)}`)
        onObjectFound?.({ label, bbox, frameUrl, frameWidth: canvas.width, frameHeight: canvas.height })
      }
    } catch (err) {
      console.warn('[screen] scan error:', err.message)
    }
  }

  // Expose the raw video element ref so callers can capture frames themselves
  // without adding any new hook calls to the chain.
  return { status, startCapture, stopCapture, captureVideoRef: captureRef }
}
