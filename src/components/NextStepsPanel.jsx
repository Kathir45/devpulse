import { Lightbulb, Shield, GitPullRequest, Scissors, ListChecks, Rocket, Zap } from 'lucide-react'

const ICON_MAP = {
  shield: Shield,
  'git-pull-request': GitPullRequest,
  scissors: Scissors,
  'list-checks': ListChecks,
  rocket: Rocket,
  zap: Zap,
}

export default function NextStepsPanel({ nextSteps }) {
  if (!nextSteps || nextSteps.length === 0) return null

  return (
    <div className="panel animate-in animate-in-delay-4">
      <div className="panel-header">
        <div className="panel-header-icon" style={{ 
          background: 'var(--accent-amber-soft)', 
          color: 'var(--accent-amber)' 
        }}>
          <Lightbulb size={20} />
        </div>
        <h2 className="panel-title">Suggested next steps</h2>
      </div>

      {nextSteps.map((step, index) => {
        const Icon = ICON_MAP[step.icon] || Lightbulb
        return (
          <div key={index} className="next-step">
            <div className="next-step-header">
              <div className="next-step-icon">
                <Icon size={16} />
              </div>
              <span className="next-step-title">{step.title}</span>
              <span className={`priority-indicator ${step.priority}`}>
                {step.priority}
              </span>
            </div>
            <p className="next-step-description">{step.description}</p>
          </div>
        )
      })}
    </div>
  )
}
