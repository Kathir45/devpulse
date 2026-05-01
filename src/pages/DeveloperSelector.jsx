import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DeveloperSelector() {
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/developers')
      .then(res => res.json())
      .then(data => {
        setDevelopers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load developers:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="loading-container" role="status" aria-label="Loading developers">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Group developers by team
  const teams = {}
  developers.forEach(dev => {
    if (!teams[dev.team_name]) {
      teams[dev.team_name] = { name: dev.team_name, type: dev.service_type, devs: [] }
    }
    teams[dev.team_name].devs.push(dev)
  })

  return (
    <section aria-label="Developer profiles">
      <header className="page-header animate-in">
        <h1 className="page-title">Developer Profiles</h1>
        <p className="page-subtitle">
          Select a developer to see their productivity metrics, understand what's happening, and discover actionable next steps.
        </p>
      </header>

      {Object.values(teams).map((team, teamIdx) => (
        <section key={team.name} className={`team-section animate-in animate-in-delay-${teamIdx + 1}`} aria-label={`${team.name} team`}>
          <h2 className="team-label">{team.name} — {team.type}</h2>
          <div className="dev-grid" role="list">
            {team.devs.map(dev => {
              const initials = dev.developer_name.split(' ').map(n => n[0]).join('')
              return (
                <article
                  key={dev.developer_id}
                  className="dev-card"
                  onClick={() => navigate(`/developer/${dev.developer_id}`)}
                  role="listitem"
                  tabIndex={0}
                  id={`dev-card-${dev.developer_id}`}
                  aria-label={`View profile for ${dev.developer_name}`}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/developer/${dev.developer_id}`)}
                >
                  <div className="dev-card-header">
                    <div className={`dev-avatar ${dev.service_type}`} aria-hidden="true">
                      {initials}
                    </div>
                    <div>
                      <h3 className="dev-name">{dev.developer_name}</h3>
                      <div className="dev-meta">Manager: {dev.manager_name}</div>
                    </div>
                  </div>
                  <div className="dev-tags" aria-label="Developer tags">
                    <span className="dev-tag">{dev.level}</span>
                    <span className="dev-tag">{dev.service_type}</span>
                    <span className="dev-tag">{dev.developer_id}</span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </section>
  )
}
