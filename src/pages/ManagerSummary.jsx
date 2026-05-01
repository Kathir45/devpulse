import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Users, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

export default function ManagerSummary() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [managers, setManagers] = useState([])
  const [month, setMonth] = useState('2026-04')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/managers').then(r => r.json()).then(setManagers)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/manager/${id}?month=${month}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id, month])

  if (loading || !data) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const { manager, teamMetrics, developers, signal } = data

  const signalStyle = signal === 'Healthy flow'
    ? { bg: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)', icon: CheckCircle }
    : { bg: 'var(--accent-amber-soft)', color: 'var(--accent-amber)', icon: AlertTriangle }

  const SignalIcon = signalStyle.icon

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={16} />
        All developers
      </button>

      <div className="profile-header animate-in">
        <div className="profile-info">
          <div className="profile-avatar" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)' }}>
            <Users size={32} />
          </div>
          <div className="profile-details">
            <h1>{manager.name}</h1>
            <div className="team-info">
              <span>{manager.team}</span>
              <span>•</span>
              <span>{teamMetrics.teamSize} developers</span>
              <span>•</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                color: signalStyle.color,
                fontWeight: 600,
              }}>
                <SignalIcon size={14} />
                {signal}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Manager switcher */}
          <div className="month-selector">
            {managers.map(m => (
              <button
                key={m.id}
                className={`month-btn ${id === m.id ? 'active' : ''}`}
                onClick={() => navigate(`/manager/${m.id}`)}
              >
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="month-selector">
            <button className={`month-btn ${month === '2026-03' ? 'active' : ''}`} onClick={() => setMonth('2026-03')}>Mar</button>
            <button className={`month-btn ${month === '2026-04' ? 'active' : ''}`} onClick={() => setMonth('2026-04')}>Apr</button>
          </div>
        </div>
      </div>

      {/* Team aggregate stats */}
      <div className="manager-grid animate-in animate-in-delay-1" style={{ marginBottom: '32px' }}>
        <div className="team-stat-card">
          <div className="team-stat-value" style={{ color: 'var(--accent-teal)' }}>
            {teamMetrics.avgLeadTime}
          </div>
          <div className="team-stat-label">Avg Lead Time (days)</div>
        </div>
        <div className="team-stat-card">
          <div className="team-stat-value" style={{ color: 'var(--accent-blue)' }}>
            {teamMetrics.avgCycleTime}
          </div>
          <div className="team-stat-label">Avg Cycle Time (days)</div>
        </div>
        <div className="team-stat-card">
          <div className="team-stat-value" style={{ color: 'var(--accent-purple)' }}>
            {teamMetrics.totalPRs}
          </div>
          <div className="team-stat-label">Total Merged PRs</div>
        </div>
        <div className="team-stat-card">
          <div className="team-stat-value" style={{ color: 'var(--accent-amber)' }}>
            {teamMetrics.totalDeploys}
          </div>
          <div className="team-stat-label">Total Deployments</div>
        </div>
        <div className="team-stat-card">
          <div className="team-stat-value" style={{ color: teamMetrics.avgBugRate > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
            {(teamMetrics.avgBugRate * 100).toFixed(0)}%
          </div>
          <div className="team-stat-label">Avg Bug Rate</div>
        </div>
      </div>

      {/* Developer summary table */}
      <div className="panel animate-in animate-in-delay-2">
        <div className="panel-header">
          <div className="panel-header-icon" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)' }}>
            <TrendingUp size={20} />
          </div>
          <h2 className="panel-title">Team Members</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="dev-summary-table">
            <thead>
              <tr>
                <th>Developer</th>
                <th>Level</th>
                <th>Lead Time</th>
                <th>Cycle Time</th>
                <th>PRs</th>
                <th>Deploys</th>
                <th>Bug Rate</th>
                <th>Pattern</th>
              </tr>
            </thead>
            <tbody>
              {developers.map(({ developer: dev, metrics, pattern, ratings }) => {
                const patternColor = pattern === 'Healthy flow' ? 'var(--accent-emerald)'
                  : pattern === 'Quality watch' ? 'var(--accent-amber)'
                  : 'var(--accent-rose)'
                return (
                  <tr key={dev.developer_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/developer/${dev.developer_id}`)}>
                    <td style={{ fontWeight: 600 }}>{dev.developer_name}</td>
                    <td><span className="dev-tag">{dev.level}</span></td>
                    <td>{metrics.leadTime} days</td>
                    <td>{metrics.cycleTime} days</td>
                    <td>{metrics.prThroughput}</td>
                    <td>{metrics.deployFrequency}</td>
                    <td>{(metrics.bugRate * 100).toFixed(0)}%</td>
                    <td>
                      <span style={{
                        color: patternColor,
                        fontWeight: 600,
                        fontSize: '13px',
                      }}>
                        {pattern}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
