import './HelpModal.css'

const SECTIONS = [
  {
    icon: '🎬',
    title: 'Pick a video',
    text: 'Search for a video with captions, paste a YouTube link, or tap one of the suggested videos.',
  },
  {
    icon: '🌍',
    title: 'Choose your language',
    text: 'Pick the language you want translations shown in during challenges.',
  },
  {
    icon: '⏱',
    title: 'Set the challenge frequency',
    text: 'Choose how often the video pauses for a word challenge — from every 30 seconds to every 5 minutes.',
  },
  {
    icon: '🎤',
    title: 'Answer challenges',
    text: 'When a challenge appears, listen to the word and its translation, then say the word out loud into the microphone (or type it if the mic isn’t available).',
  },
  {
    icon: '⭐',
    title: 'Score, streaks & levels',
    text: 'Correct answers earn points and build a streak. Keep learning to level up!',
  },
  {
    icon: '📚',
    title: 'My Dictionary',
    text: 'Tap the words button at the top of the screen to see every word you’ve learned and how well you know it.',
  },
  {
    icon: '🗓',
    title: 'Word schedule',
    text: 'Tap the caption badge under the score bar to preview which words are coming up and when.',
  },
  {
    icon: '←',
    title: 'Back to setup',
    text: 'Use the Back button anytime to stop the video and pick a new one.',
  },
]

export default function HelpModal({ onClose }) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="help-header">
          <span className="help-title">❓ How to Play</span>
          <button className="help-close" onClick={onClose} aria-label="Close help">✕</button>
        </div>

        <div className="help-body">
          {SECTIONS.map((s, i) => (
            <div className="help-section" key={i}>
              <span className="help-section-icon">{s.icon}</span>
              <div className="help-section-text">
                <strong className="help-section-title">{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
