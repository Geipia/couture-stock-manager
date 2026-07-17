import { Sparkles, CheckCircle2 } from 'lucide-react'
import Modal from './Modal'
import { CHANGELOG } from '../utils/version'

export default function WhatsNewModal({ onClose }) {
  return (
    <Modal title={CHANGELOG.title} onClose={onClose} size="md">
      <div className="whats-new">
        <div className="whats-new__badge">
          <Sparkles size={14} /> Version {CHANGELOG.version}
        </div>
        <p className="whats-new__intro">{CHANGELOG.intro}</p>

        {CHANGELOG.sections.map(section => (
          <div key={section.heading} className="whats-new__section">
            <h3>{section.heading}</h3>
            <ul>
              {section.items.map(item => (
                <li key={item}>
                  <CheckCircle2 size={15} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <button className="btn btn--primary btn--full" onClick={onClose}>
          C'est parti !
        </button>
      </div>
    </Modal>
  )
}
