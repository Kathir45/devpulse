import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { TrendingUp } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div style={{
      background: '#1e1e32',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '13px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontWeight: 600, marginBottom: '6px', color: '#f0f0f5' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function TrendChart({ trendData }) {
  if (!trendData || trendData.length === 0) return null

  const chartData = trendData.map(d => ({
    month: d.month === '2026-03' ? 'Mar 2026' : 'Apr 2026',
    'Cycle Time': d.cycleTime,
    'Lead Time': d.leadTime,
    'PR Throughput': d.prThroughput,
    'Deploy Freq': d.deployFrequency,
    'Bug Rate': Math.round(d.bugRate * 100),
    'Health Score': d.healthScore,
    'Review Wait': d.avgReviewWaitHours,
    'Lines Changed': d.avgLinesChanged,
  }))

  // Radar chart data for overall profile
  const latestData = trendData[trendData.length - 1]
  const radarData = [
    { metric: 'Speed', value: Math.max(0, 100 - latestData.cycleTime * 15), fullMark: 100 },
    { metric: 'Delivery', value: Math.max(0, 100 - latestData.leadTime * 15), fullMark: 100 },
    { metric: 'Throughput', value: latestData.prThroughput * 25, fullMark: 100 },
    { metric: 'Deployment', value: latestData.deployFrequency * 25, fullMark: 100 },
    { metric: 'Quality', value: (1 - latestData.bugRate) * 100, fullMark: 100 },
  ]

  return (
    <div className="trend-section animate-in animate-in-delay-5">
      <div className="chart-container">
        <div className="panel-header">
          <div className="panel-header-icon" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)' }}>
            <TrendingUp size={20} />
          </div>
          <h2 className="panel-title">Performance Trends & Profile</h2>
        </div>
        
        <div className="trend-charts-grid">
          {/* Radar Chart — Developer Profile */}
          <div className="trend-chart-item radar-chart-item">
            <p className="trend-chart-label">Developer Profile</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fill: '#8a8aa0', fontSize: 11 }}
                />
                <Radar
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Area Charts — Key Metrics */}
          {[
            { key: 'Cycle Time', color: '#3b82f6', gradientId: 'cycle' },
            { key: 'Lead Time', color: '#14b8a6', gradientId: 'lead' },
            { key: 'Bug Rate', color: '#f43f5e', gradientId: 'bug' },
          ].map(({ key, color, gradientId }) => (
            <div key={key} className="trend-chart-item">
              <p className="trend-chart-label">{key}</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#8a8aa0', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <YAxis 
                    tick={{ fill: '#8a8aa0', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    fill={`url(#${gradientId})`}
                    strokeWidth={2.5}
                    dot={{ fill: color, strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: color, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}

          {/* Health Score trend */}
          <div className="trend-chart-item">
            <p className="trend-chart-label">Health Score</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#8a8aa0', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <YAxis 
                  tick={{ fill: '#8a8aa0', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  domain={[0, 100]}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Health Score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={entry['Health Score'] >= 80 ? '#10b981' : entry['Health Score'] >= 60 ? '#14b8a6' : '#f59e0b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Review Wait Time */}
          <div className="trend-chart-item">
            <p className="trend-chart-label">Avg Review Wait (hours)</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="reviewWait" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#8a8aa0', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <YAxis 
                  tick={{ fill: '#8a8aa0', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Review Wait"
                  stroke="#f59e0b"
                  fill="url(#reviewWait)"
                  strokeWidth={2.5}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
