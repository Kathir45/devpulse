import { Brain, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

function getPatternStyle(pattern) {
  if (pattern === 'Healthy flow') return { className: 'healthy', icon: CheckCircle }
  if (pattern === 'Quality watch') return { className: 'watch', icon: AlertTriangle }
  return { className: 'attention', icon: AlertCircle }
}

export default function InterpretationPanel({ pattern, interpretation }) {
  const { className, icon: Icon } = getPatternStyle(pattern)

  return (
    <div className="panel animate-in animate-in-delay-3">
      <div className="panel-header">
        <div className="panel-header-icon" style={{ 
          background: 'var(--accent-purple-soft)', 
          color: 'var(--accent-purple)' 
        }}>
          <Brain size={20} />
        </div>
        <h2 className="panel-title">What's happening</h2>
      </div>
      
      <div className={`pattern-badge ${className}`}>
        <Icon size={16} />
        {pattern}
      </div>

      <p className="interpretation-text">
        {interpretation}
      </p>
    </div>
  )
}
