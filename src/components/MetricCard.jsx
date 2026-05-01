import { useEffect, useState } from 'react'
import { Clock, GitPullRequest, Rocket, Bug, Timer, ChevronRight } from 'lucide-react'

const METRIC_CONFIG = {
  leadTime: {
    label: 'Lead Time',
    unit: 'days',
    icon: Clock,
    color: 'teal',
    lowerBetter: true,
    description: 'PR opened → production deploy',
  },
  cycleTime: {
    label: 'Cycle Time',
    unit: 'days',
    icon: Timer,
    color: 'blue',
    lowerBetter: true,
    description: 'In Progress → Done',
  },
  prThroughput: {
    label: 'PR Throughput',
    unit: 'PRs',
    icon: GitPullRequest,
    color: 'purple',
    lowerBetter: false,
    description: 'Merged PRs this month',
  },
  deployFrequency: {
    label: 'Deploy Frequency',
    unit: 'deploys',
    icon: Rocket,
    color: 'amber',
    lowerBetter: false,
    description: 'Prod deployments this month',
  },
  bugRate: {
    label: 'Bug Rate',
    unit: '%',
    icon: Bug,
    color: 'rose',
    lowerBetter: true,
    description: 'Escaped bugs / issues done',
  },
}

function getTrend(current, previous, lowerBetter) {
  if (previous === null || previous === undefined) return { type: 'stable', text: '—' }
  const diff = current - previous
  if (Math.abs(diff) < 0.05) return { type: 'stable', text: 'No change' }
  
  const improved = lowerBetter ? diff < 0 : diff > 0
  const direction = diff > 0 ? '↑' : '↓'
  const absVal = Math.abs(diff)
  const text = `${direction} ${absVal % 1 === 0 ? absVal : absVal.toFixed(1)} vs last month`
  
  return { 
    type: improved ? 'improving' : 'declining',
    text,
  }
}

// Animated counter hook
function useAnimatedCounter(target, duration = 1000) {
  const [value, setValue] = useState(0)
  
  useEffect(() => {
    const startTime = performance.now()
    const isDecimal = target % 1 !== 0
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease out cubic
      
      const current = eased * target
      setValue(isDecimal ? Math.round(current * 100) / 100 : Math.round(current))
      
      if (progress < 1) requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }, [target, duration])
  
  return value
}

export default function MetricCard({ metricKey, value, previousValue, rating, delay = 0, onClick }) {
  const config = METRIC_CONFIG[metricKey]
  if (!config) return null

  const Icon = config.icon
  const rawDisplayValue = metricKey === 'bugRate' ? value * 100 : value
  const animatedValue = useAnimatedCounter(rawDisplayValue, 800 + delay * 100)
  
  const displayValue = metricKey === 'bugRate'
    ? animatedValue.toFixed(0)
    : (rawDisplayValue % 1 === 0 ? animatedValue : animatedValue.toFixed(1))
  
  const prevVal = previousValue !== null && previousValue !== undefined
    ? (metricKey === 'bugRate' ? previousValue : previousValue)
    : null
  
  const trend = getTrend(
    metricKey === 'bugRate' ? value * 100 : value,
    prevVal !== null ? (metricKey === 'bugRate' ? prevVal * 100 : prevVal) : null,
    config.lowerBetter
  )

  return (
    <div 
      className={`metric-card animate-in animate-in-delay-${delay} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="metric-card-header">
        <div className={`metric-icon ${config.color}`}>
          <Icon size={20} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {rating && (
            <span className={`metric-badge ${rating}`}>
              {rating === 'needs-focus' ? 'Needs Focus' : rating}
            </span>
          )}
          {onClick && <ChevronRight size={14} className="drill-icon" />}
        </div>
      </div>
      <div className="metric-label">{config.label}</div>
      <div className="metric-value-row">
        <span className="metric-value">{displayValue}</span>
        <span className="metric-unit">{config.unit}</span>
      </div>
      <div className="metric-description">{config.description}</div>
      <div className={`metric-trend ${trend.type}`}>
        {trend.text}
      </div>
    </div>
  )
}
