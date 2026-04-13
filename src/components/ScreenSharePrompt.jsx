import './ScreenSharePrompt.css'

export default function ScreenSharePrompt({ onShare, onSkip }) {
  return (
    <div className="ssp-overlay">
      <div className="ssp-card">

        <div className="ssp-icon">🎯</div>
        <h2 className="ssp-title">Better images = better learning</h2>
        <p className="ssp-desc">
          For the <strong>best experience</strong>, allow tab sharing so the app
          can show the <em>exact</em> video frame when it pauses — the image
          will always match what you're watching.
        </p>

        <div className="ssp-compare">
          <div className="ssp-compare-col ssp-compare-col--bad">
            <div className="ssp-compare-icon">🖼️</div>
            <div className="ssp-compare-label">Without sharing</div>
            <div className="ssp-compare-desc">Approximate thumbnail — may not match</div>
          </div>
          <div className="ssp-compare-divider">vs</div>
          <div className="ssp-compare-col ssp-compare-col--good">
            <div className="ssp-compare-icon">📸</div>
            <div className="ssp-compare-label">With sharing</div>
            <div className="ssp-compare-desc">Exact paused frame — always matches</div>
          </div>
        </div>

        <p className="ssp-privacy">
          🔒 Only this browser tab is shared — no camera, no audio, nothing else.
        </p>

        <button className="ssp-btn-share" onClick={onShare}>
          📸 Share this tab for best results
        </button>

        <button className="ssp-btn-skip" onClick={onSkip}>
          Continue without sharing
        </button>

      </div>
    </div>
  )
}
