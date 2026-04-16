import React, { useState } from 'react'

interface Model {
  id: string
  name: string
  size: string
  desc: string
  recommended?: boolean
}

const MODELS: Model[] = [
  { id: 'mistral', name: 'Mistral 7B', size: '4.1 GB', desc: 'Meilleure qualité, recommandé', recommended: true },
  { id: 'llama3.2', name: 'Llama 3.2 3B', size: '2.0 GB', desc: 'Bon équilibre qualité / rapidité' },
  { id: 'tinyllama', name: 'TinyLlama', size: '637 MB', desc: 'Très léger, PC moins puissants' },
]

interface SetupWizardProps {
  onComplete: (model: string) => void
  onSkip: () => void
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
  const [selected, setSelected] = useState<string>('mistral')
  const [step, setStep] = useState<'select' | 'downloading' | 'done' | 'error'>('select')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')

  const handleDownload = async () => {
    setStep('downloading')
    setProgress(0)
    setProgressLabel('Connexion à Ollama...')

    try {
      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selected, stream: true }),
      })

      if (!response.ok) throw new Error(`Ollama non disponible (${response.status})`)

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            if (json.status) setProgressLabel(json.status)
            if (json.total && json.completed) {
              setProgress(Math.round((json.completed / json.total) * 100))
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      setStep('done')
      setTimeout(() => onComplete(selected), 1500)
    } catch (err) {
      setStep('error')
    }
  }

  return (
    <div className="setup-wizard-overlay">
      <div className="setup-wizard">
        <div className="setup-wizard-header">
          <span className="setup-wizard-logo">🧠</span>
          <h1>Bienvenue dans Node Organisation</h1>
          <p>Pour utiliser l'IA, choisissez un modèle Ollama à télécharger.</p>
        </div>

        {step === 'select' && (
          <>
            <div className="setup-models">
              {MODELS.map((m) => (
                <div
                  key={m.id}
                  className={`setup-model-card ${selected === m.id ? 'selected' : ''}`}
                  onClick={() => setSelected(m.id)}
                >
                  <div className="setup-model-radio">
                    <span className={`setup-radio ${selected === m.id ? 'checked' : ''}`} />
                  </div>
                  <div className="setup-model-info">
                    <div className="setup-model-name">
                      {m.name}
                      {m.recommended && <span className="setup-model-badge">Recommandé</span>}
                    </div>
                    <div className="setup-model-desc">{m.desc}</div>
                    <div className="setup-model-size">{m.size}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="setup-wizard-hint">
              Assurez-vous qu'Ollama est lancé avant de continuer.<br />
              Le téléchargement peut prendre quelques minutes selon votre connexion.
            </div>

            <div className="setup-wizard-actions">
              <button className="setup-skip-btn" onClick={onSkip}>
                Passer (configurer plus tard)
              </button>
              <button className="setup-download-btn" onClick={handleDownload}>
                ⬇ Télécharger {selected}
              </button>
            </div>
          </>
        )}

        {step === 'downloading' && (
          <div className="setup-downloading">
            <div className="setup-progress-label">{progressLabel}</div>
            <div className="setup-progress-bar">
              <div className="setup-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="setup-progress-pct">{progress}%</div>
            <p className="setup-downloading-note">
              Ne fermez pas l'application pendant le téléchargement.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="setup-done">
            <div className="setup-done-icon">✅</div>
            <div className="setup-done-text">Modèle installé avec succès !</div>
            <div className="setup-done-sub">Lancement de l'application...</div>
          </div>
        )}

        {step === 'error' && (
          <div className="setup-error">
            <div className="setup-error-icon">⚠️</div>
            <div className="setup-error-text">Ollama n'est pas accessible.</div>
            <div className="setup-error-sub">
              Vérifiez qu'Ollama est lancé (cherchez l'icône dans la barre des tâches), puis réessayez.
            </div>
            <div className="setup-wizard-actions">
              <button className="setup-skip-btn" onClick={onSkip}>Passer pour l'instant</button>
              <button className="setup-download-btn" onClick={() => setStep('select')}>Réessayer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SetupWizard
