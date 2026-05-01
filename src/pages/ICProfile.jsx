import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Code, FileCode, Activity } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import InterpretationPanel from '../components/InterpretationPanel'
import NextStepsPanel from '../components/NextStepsPanel'
import TrendChart from '../components/TrendChart'
import HealthScore from '../components/HealthScore'
import FlowBreakdown from '../components/FlowBreakdown'
import DrilldownModal from '../components/DrilldownModal'

export default function ICProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [trendData, setTrendData] = useState(null)
  const [month, setMonth] = useState('2026-04')
  const [loading, setLoading] = useState(true)
  const [drilldownMetric, setDrilldownMetric] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/metrics/${id}?month=${month}`).then(r => r.json()),
      fetch(`/api/metrics/${id}/trend`).then(r => r.json()),
    ])
      .then(([metricsData, trend]) => {
        setData(metricsData)
        setTrendData(trend)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load metrics:', err)
        setLoading(false)
      })
  }, [id, month])

  if (loading || !data) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const { developer, metrics, prevMetrics, pattern, interpretation, nextSteps, ratings, flowBreakdown, healthScore, prevHealthScore } = data

  const initials = developer.developer_name.split(' ').map(n => n[0]).join('')

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={16} />
        All developers
      </button>

      {/* Profile Header with Health Score */}
      <div className="profile-header animate-in">
        <div className="profile-info">
          <div className={`profile-avatar dev-avatar ${developer.service_type}`}>
            {initials}
          </div>
          <div className="profile-details">
            <h1>{developer.developer_name}</h1>
            <div className="team-info">
              <span>{developer.team_name}</span>
              <span>•</span>
              <span>{developer.level}</span>
              <span>•</span>
              <span>{developer.service_type}</span>
              <span>•</span>
              <span>Manager: {developer.manager_name}</span>
            </div>
          </div>
        </div>

        <div className="profile-right">
          <HealthScore score={healthScore} previousScore={prevHealthScore} />
          <div className="month-selector">
            <button
              className={`month-btn ${month === '2026-03' ? 'active' : ''}`}
              onClick={() => setMonth('2026-03')}
            >
              Mar 2026
            </button>
            <button
              className={`month-btn ${month === '2026-04' ? 'active' : ''}`}
              onClick={() => setMonth('2026-04')}
            >
              Apr 2026
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="quick-stats animate-in animate-in-delay-1">
        <div className="quick-stat">
          <FileCode size={14} />
          <span>{metrics.totalLinesChanged} lines changed</span>
        </div>
        <div className="quick-stat">
          <Activity size={14} />
          <span>{metrics.totalStoryPoints} story points</span>
        </div>
        <div className="quick-stat">
          <Code size={14} />
          <span>{metrics.avgReviewRounds} avg review rounds</span>
        </div>
      </div>

      {/* Metric Cards — clickable for drill-down */}
      <div className="metrics-grid">
        <MetricCard
          metricKey="leadTime"
          value={metrics.leadTime}
          previousValue={prevMetrics?.leadTime}
          rating={ratings.leadTime}
          delay={1}
          onClick={() => setDrilldownMetric('leadTime')}
        />
        <MetricCard
          metricKey="cycleTime"
          value={metrics.cycleTime}
          previousValue={prevMetrics?.cycleTime}
          rating={ratings.cycleTime}
          delay={2}
          onClick={() => setDrilldownMetric('cycleTime')}
        />
        <MetricCard
          metricKey="prThroughput"
          value={metrics.prThroughput}
          previousValue={prevMetrics?.prThroughput}
          rating={ratings.prThroughput}
          delay={3}
          onClick={() => setDrilldownMetric('prThroughput')}
        />
        <MetricCard
          metricKey="deployFrequency"
          value={metrics.deployFrequency}
          previousValue={prevMetrics?.deployFrequency}
          rating={ratings.deployFrequency}
          delay={4}
          onClick={() => setDrilldownMetric('deployFrequency')}
        />
        <MetricCard
          metricKey="bugRate"
          value={metrics.bugRate}
          previousValue={prevMetrics?.bugRate}
          rating={ratings.bugRate}
          delay={5}
          onClick={() => setDrilldownMetric('bugRate')}
        />
      </div>

      {/* Interpretation + Next Steps */}
      <div className="interpretation-section">
        <InterpretationPanel pattern={pattern} interpretation={interpretation} />
        <NextStepsPanel nextSteps={nextSteps} />
      </div>

      {/* Flow Breakdown — Pipeline Stage Analysis */}
      <FlowBreakdown flowData={flowBreakdown} />

      {/* Trend Charts + Radar Profile */}
      <TrendChart trendData={trendData} />

      {/* Drill-down Modal */}
      {drilldownMetric && (
        <DrilldownModal
          devId={id}
          month={month}
          metricKey={drilldownMetric}
          onClose={() => setDrilldownMetric(null)}
        />
      )}
    </div>
  )
}
