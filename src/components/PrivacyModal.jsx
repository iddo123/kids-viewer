import './HelpModal.css'

export default function PrivacyModal({ onClose }) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="help-header">
          <span className="help-title">🔒 Privacy</span>
          <button className="help-close" onClick={onClose} aria-label="Close privacy info">✕</button>
        </div>

        <div className="help-body">
          <div className="help-section">
            <span className="help-section-icon">🙈</span>
            <div className="help-section-text">
              <strong className="help-section-title">No accounts needed for kids</strong>
              <p>A grown-up signs in to use the app. Your child's learning progress (words learned, score, streaks) is saved only on this device — it is never uploaded anywhere.</p>
            </div>
          </div>

          <div className="help-section">
            <span className="help-section-icon">🎬</span>
            <div className="help-section-text">
              <strong className="help-section-title">YouTube videos</strong>
              <p>Videos are played using YouTube's privacy-enhanced embed mode, which avoids setting tracking cookies for viewers.</p>
            </div>
          </div>

          <div className="help-section">
            <span className="help-section-icon">🗣️</span>
            <div className="help-section-text">
              <strong className="help-section-title">Microphone use</strong>
              <p>If you use the speak-the-word challenges, your browser's built-in speech recognition listens for the spoken word. Audio is processed by your browser/device — this app does not record, store, or transmit audio.</p>
            </div>
          </div>

          <div className="help-section">
            <span className="help-section-icon">🛟</span>
            <div className="help-section-text">
              <strong className="help-section-title">Crash reports</strong>
              <p>If something goes wrong, an anonymous technical error report may be sent to help us fix bugs. These reports never include names, what your child typed or said, or any other personal info.</p>
            </div>
          </div>

          <div className="help-section">
            <span className="help-section-icon">✉️</span>
            <div className="help-section-text">
              <strong className="help-section-title">Questions?</strong>
              <p>Contact the app developer with any privacy questions or requests.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
