import { useEffect, useRef, useState } from 'react'

export default function HealthScore({ score, previousScore, size = 140 }) {
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    if (!safeScore) { setAnimatedScore(0); return }
    const duration = 1200
    const startTime = performance.now()
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * safeScore))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [safeScore])

  const percentage = animatedScore / 100
  const offset = circumference * (1 - percentage)

  const getColor = (s) => {
    if (s >= 80) return '#10b981'
    if (s >= 60) return '#14b8a6'
    if (s >= 40) return '#f59e0b'
    return '#f43f5e'
  }

  const getLabel = (s) => {
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Fair'
    return 'Needs Attention'
  }

  const color = getColor(safeScore)
  const change = previousScore != null ? safeScore - previousScore : null

  return (
    <div className="health-score-container">
      <div className="health-score-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Animated progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
          {/* Glow effect */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            opacity="0.3"
            filter="blur(6px)"
          />
        </svg>
        <div className="health-score-value">
          <span className="health-score-number" style={{ color }}>{animatedScore}</span>
          <span className="health-score-max">/100</span>
        </div>
      </div>
      <div className="health-score-info">
        <span className="health-score-label" style={{ color }}>{getLabel(score)}</span>
        {change != null && (
          <span className={`health-score-change ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>
            {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)} pts vs last month
          </span>
        )}
      </div>
    </div>
  )
}
