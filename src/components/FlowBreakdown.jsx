import { ArrowRight, Clock, GitMerge, Rocket } from 'lucide-react'

export default function FlowBreakdown({ flowData }) {
  if (!flowData) return null

  const { stages, totalHours, bottleneck } = flowData

  return (
    <div className="panel flow-breakdown animate-in animate-in-delay-3">
      <div className="panel-header">
        <div className="panel-header-icon" style={{ 
          background: 'var(--accent-teal-soft)', 
          color: 'var(--accent-teal)' 
        }}>
          <ArrowRight size={20} />
        </div>
        <h2 className="panel-title">Pipeline Flow Breakdown</h2>
        <span className="flow-total-badge">{totalHours}h avg per PR</span>
      </div>

      <p className="flow-subtitle">
        Where time is spent from PR opened to production deploy
      </p>

      {/* Visual pipeline bar */}
      <div className="flow-pipeline">
        {stages.map((stage, i) => (
          <div
            key={stage.name}
            className={`flow-pipeline-segment ${stage.name === bottleneck ? 'bottleneck' : ''}`}
            style={{
              width: `${Math.max(stage.percentage, 12)}%`,
              background: stage.color,
            }}
            title={`${stage.name}: ${stage.hours}h (${stage.percentage}%)`}
          >
            <span className="flow-segment-label">{stage.percentage}%</span>
          </div>
        ))}
      </div>

      {/* Stage details */}
      <div className="flow-stages">
        {stages.map((stage, i) => {
          const icons = [Clock, GitMerge, Rocket]
          const Icon = icons[i] || Clock
          const isBottleneck = stage.name === bottleneck

          return (
            <div key={stage.name} className={`flow-stage ${isBottleneck ? 'bottleneck' : ''}`}>
              <div className="flow-stage-header">
                <div className="flow-stage-icon" style={{ background: `${stage.color}20`, color: stage.color }}>
                  <Icon size={16} />
                </div>
                <div className="flow-stage-info">
                  <span className="flow-stage-name">{stage.name}</span>
                  {isBottleneck && <span className="bottleneck-badge">Bottleneck</span>}
                </div>
                <span className="flow-stage-hours" style={{ color: stage.color }}>
                  {stage.hours}h
                </span>
              </div>
              <p className="flow-stage-desc">{stage.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
