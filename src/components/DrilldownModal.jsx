import { useState, useEffect } from 'react'
import { X, GitPullRequest, CheckCircle, Bug, Rocket, FileCode } from 'lucide-react'

export default function DrilldownModal({ devId, month, metricKey, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/metrics/${devId}/drilldown?month=${month}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [devId, month])

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="loading-container"><div className="loading-spinner"></div></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const renderContent = () => {
    switch (metricKey) {
      case 'leadTime':
      case 'prThroughput':
        return (
          <div>
            <h3 className="drilldown-section-title">
              <GitPullRequest size={16} /> Pull Requests ({data.pullRequests.length})
            </h3>
            <div className="drilldown-table-wrap">
              <table className="drilldown-table">
                <thead>
                  <tr>
                    <th>PR</th>
                    <th>Issue</th>
                    <th>Lines Changed</th>
                    <th>Review Wait</th>
                    <th>Total Time</th>
                    <th>Review Rounds</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pullRequests.map(pr => (
                    <tr key={pr.id}>
                      <td><span className="mono-text">{pr.id}</span></td>
                      <td><span className="mono-text">{pr.issueId}</span></td>
                      <td>
                        <span className={`lines-badge ${pr.linesChanged > 500 ? 'large' : pr.linesChanged > 300 ? 'medium' : 'small'}`}>
                          +{pr.linesChanged}
                        </span>
                      </td>
                      <td>{pr.reviewWaitHours}h</td>
                      <td>{pr.mergeTimeHours}h</td>
                      <td>
                        <span className="review-dots">
                          {Array.from({ length: pr.reviewRounds }).map((_, i) => (
                            <span key={i} className="review-dot" />
                          ))}
                        </span>
                        {pr.reviewRounds}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'cycleTime':
        return (
          <div>
            <h3 className="drilldown-section-title">
              <CheckCircle size={16} /> Issues Completed ({data.issues.length})
            </h3>
            <div className="drilldown-table-wrap">
              <table className="drilldown-table">
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Type</th>
                    <th>Story Points</th>
                    <th>Cycle Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.issues.map(issue => (
                    <tr key={issue.id}>
                      <td><span className="mono-text">{issue.id}</span></td>
                      <td>
                        <span className={`issue-type-badge ${issue.type.toLowerCase()}`}>
                          {issue.type}
                        </span>
                      </td>
                      <td>{issue.storyPoints} SP</td>
                      <td>
                        <span className={issue.cycleTimeDays > 5 ? 'text-warning' : ''}>
                          {issue.cycleTimeDays} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'deployFrequency':
        return (
          <div>
            <h3 className="drilldown-section-title">
              <Rocket size={16} /> Deployments ({data.deployments.length})
            </h3>
            <div className="drilldown-table-wrap">
              <table className="drilldown-table">
                <thead>
                  <tr>
                    <th>Deploy</th>
                    <th>PR</th>
                    <th>Lead Time</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deployments.map(d => (
                    <tr key={d.id}>
                      <td><span className="mono-text">{d.id}</span></td>
                      <td><span className="mono-text">{d.prId}</span></td>
                      <td>{d.leadTimeDays} days</td>
                      <td>
                        <span className={`release-badge ${d.releaseType}`}>
                          {d.releaseType}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge success">
                          <CheckCircle size={12} /> {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'bugRate':
        return (
          <div>
            <h3 className="drilldown-section-title">
              <Bug size={16} /> Bug Reports ({data.bugs.length})
            </h3>
            {data.bugs.length === 0 ? (
              <div className="drilldown-empty">
                <CheckCircle size={32} style={{ color: 'var(--accent-emerald)' }} />
                <p>No escaped bugs this month. Great job! 🎉</p>
              </div>
            ) : (
              <div className="drilldown-bugs">
                {data.bugs.map(bug => (
                  <div key={bug.id} className="bug-card">
                    <div className="bug-card-header">
                      <span className="mono-text">{bug.id}</span>
                      <span className={`severity-badge ${bug.severity}`}>{bug.severity}</span>
                    </div>
                    <div className="bug-card-details">
                      <div className="bug-detail">
                        <span className="bug-detail-label">Root Cause</span>
                        <span className="bug-detail-value">{bug.rootCause}</span>
                      </div>
                      <div className="bug-detail">
                        <span className="bug-detail-label">Linked Issue</span>
                        <span className="bug-detail-value mono-text">{bug.linkedIssue}</span>
                      </div>
                      <div className="bug-detail">
                        <span className="bug-detail-label">Status</span>
                        <span className={`status-badge ${bug.status.toLowerCase()}`}>{bug.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      default:
        return <p>Select a metric to see details</p>
    }
  }

  const titles = {
    leadTime: 'Lead Time — PR Details',
    cycleTime: 'Cycle Time — Issue Details',
    prThroughput: 'PR Throughput — Merged PRs',
    deployFrequency: 'Deployments — Release Details',
    bugRate: 'Bug Rate — Bug Reports',
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{titles[metricKey] || 'Drill-down'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
