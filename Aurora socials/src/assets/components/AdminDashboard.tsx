import React, { useState, useEffect } from 'react'
import axios from '../../api/axios.tsx'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#ef4444', '#64748b']

const Card = ({ title = '', children, span = 1, accent }: any) => (
  <div style={{
    background: '#1e293b',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #334155',
    borderTop: accent ? `3px solid ${accent}` : '1px solid #334155',
    gridColumn: span > 1 ? `span ${span}` : undefined,
  }}>
    {title && (
      <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '600', color: accent || '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {accent && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent, display: 'inline-block' }} />}
        {title}
      </h3>
    )}
    {children}
  </div>
)

const StatBox = ({ label, value, color = '#e2e8f0', sub = '' }: any) => (
  <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
    <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: color, margin: '0 auto 0.5rem', opacity: 0.8 }} />
    <div style={{ fontSize: '1.75rem', fontWeight: '700', color }}>{value}</div>
    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{sub}</div>}
  </div>
)

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null)
  const [engagement, setEngagement] = useState([])
  const [topCreators, setTopCreators] = useState([])
  const [growth, setGrowth] = useState([])
  const [trending, setTrending] = useState([])
  const [distribution, setDistribution] = useState(null)
  const [patterns, setPatterns] = useState(null)
  const [sentiment, setSentiment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analyzingsentiment, setAnalyzingSentiment] = useState(false)
  const [sentimentResult, setSentimentResult] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ov, eng, tc, gr, tr, dist, pat, sent] = await Promise.allSettled([
        axios.get('/api/analytics/overview'),
        axios.get('/api/analytics/engagement?days=30'),
        axios.get('/api/analytics/engagement/top-creators?limit=10'),
        axios.get('/api/analytics/users/growth?days=90'),
        axios.get('/api/analytics/content/trending?days=30'),
        axios.get('/api/analytics/content/distribution'),
        axios.get('/api/analytics/content/patterns'),
        axios.get('/api/analytics/sentiment/overview'),
      ])

      if (ov.status === 'fulfilled') setOverview(ov.value.data)
      if (eng.status === 'fulfilled') setEngagement(eng.value.data)
      if (tc.status === 'fulfilled') setTopCreators(tc.value.data)
      if (gr.status === 'fulfilled') setGrowth(gr.value.data)
      if (tr.status === 'fulfilled') setTrending(tr.value.data)
      if (dist.status === 'fulfilled') setDistribution(dist.value.data)
      if (pat.status === 'fulfilled') setPatterns(pat.value.data)
      if (sent.status === 'fulfilled') setSentiment(sent.value.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const runSentimentAnalysis = async () => {
    setAnalyzingSentiment(true)
    setSentimentResult(null)
    try {
      const res = await axios.post('/api/analytics/sentiment/analyze', { batchSize: 50 })
      setSentimentResult(res.data)
      // Refresh sentiment overview after analysis
      const updated = await axios.get('/api/analytics/sentiment/overview')
      setSentiment(updated.data)
    } catch (err) {
      setSentimentResult({ error: err.response?.data?.error || err.message })
    } finally {
      setAnalyzingSentiment(false)
    }
  }

  const pieData = distribution ? [
    { name: 'Text Only', value: distribution.breakdown.textOnly.count },
    { name: 'With Media', value: distribution.breakdown.withMedia.count },
    { name: 'Polls', value: distribution.breakdown.polls.count },
  ].filter(d => d.value > 0) : []

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, fill }: any) => {
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 25
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const sentimentPie = sentiment?.distribution ? Object.entries(sentiment.distribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  })) : []

  const sentimentColors = { Positive: '#22c55e', Negative: '#ef4444', Neutral: '#64748b', Mixed: '#f59e0b' }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', padding: '100px 1rem 2rem', color: '#e2e8f0', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#94a3b8', marginTop: '4rem' }}>Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', padding: '100px 1rem 2rem', color: '#e2e8f0', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginTop: '4rem' }}>Error: {error}</div>
        <button onClick={fetchAll} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '100px 1rem 2rem', color: '#e2e8f0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Analytics Dashboard</h1>
            <p style={{ color: '#94a3b8', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Platform insights and metrics</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={async () => {
                const { exportAnalyticsPDF } = await import('../../utils/exportAnalytics')
                exportAnalyticsPDF({ overview, engagement, topCreators, growth, trending, distribution, patterns, sentiment })
              }}
              disabled={loading}
              style={{ padding: '0.5rem 1.25rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '500', opacity: loading ? 0.5 : 1 }}
            >
              PDF Report
            </button>
            <button
              onClick={async () => {
                const { exportAnalyticsExcel } = await import('../../utils/exportAnalytics')
                exportAnalyticsExcel({ overview, engagement, topCreators, growth, trending, distribution, patterns, sentiment })
              }}
              disabled={loading}
              style={{ padding: '0.5rem 1.25rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '500', opacity: loading ? 0.5 : 1 }}
            >
              Excel Export
            </button>
            <button
              onClick={fetchAll}
              style={{ padding: '0.5rem 1.25rem', background: '#334155', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <Card accent="#6366f1"><StatBox label="Total Users" value={overview.users.total} color="#6366f1" /></Card>
            <Card accent="#22c55e"><StatBox label="Organic" value={overview.users.organic} color="#22c55e" /></Card>
            <Card accent="#f59e0b"><StatBox label="Synthetic" value={overview.users.synthetic} color="#f59e0b" /></Card>
            <Card accent="#06b6d4"><StatBox label="Weekly Active" value={overview.users.weeklyActive} color="#06b6d4" /></Card>
            <Card accent="#8b5cf6"><StatBox label="Total Posts" value={overview.content.posts} color="#8b5cf6" /></Card>
            <Card accent="#ec4899"><StatBox label="Likes" value={overview.content.likes} color="#ec4899" /></Card>
            <Card accent="#64748b"><StatBox label="Comments" value={overview.content.comments} color="#64748b" /></Card>
            <Card accent="#22c55e"><StatBox label="Engagement Rate" value={overview.engagementRate} color="#22c55e" sub="per post" /></Card>
          </div>
        )}

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>

          {/* Engagement Over Time */}
          {engagement.length > 0 && (
            <Card title="Engagement (Last 30 Days)" span={2} accent="#6366f1">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={engagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Legend />
                  <Line type="monotone" dataKey="posts" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="comments" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* User Growth */}
          {growth.length > 0 && (
            <Card title="User Growth (Last 90 Days)" accent="#22c55e">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="newOrganic" fill="#22c55e" name="Organic" stackId="a" />
                  <Bar dataKey="newSynthetic" fill="#f59e0b" name="Synthetic" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Content Distribution */}
          {pieData.length > 0 && (
            <Card title="Content Distribution" accent="#8b5cf6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={renderPieLabel} labelLine={{ stroke: '#64748b' }}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Trending Hashtags */}
          {trending.length > 0 && (
            <Card title="Trending Hashtags (30 Days)" accent="#ec4899">
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {trending.slice(0, 15).map((tag, i) => {
                  const rankColor = i < 3 ? ['#f59e0b', '#94a3b8', '#cd7f32'][i] : '#475569';
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.25rem', borderBottom: i < trending.length - 1 ? '1px solid #334155' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ background: rankColor, color: i < 3 ? '#0f172a' : '#e2e8f0', fontSize: '0.7rem', fontWeight: '700', width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                        <span style={{ color: COLORS[i % COLORS.length], fontWeight: '500' }}>#{tag.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <span style={{ color: '#8b5cf6' }}>{tag.postCount} posts</span>
                        <span style={{ color: '#ec4899' }}>{tag.engagement} eng</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Posting Patterns by Hour */}
          {patterns?.byHour && (
            <Card title="Posting Patterns (By Hour)" accent="#f59e0b">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={patterns.byHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Bar dataKey="posts" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Sentiment Analysis */}
          {sentiment && (
            <Card title="Post Sentiment" accent="#06b6d4">
              {sentimentPie.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sentimentPie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sentimentPie.map((entry, i) => <Cell key={i} fill={sentimentColors[entry.name] || COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {sentimentPie.length === 0 && (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '1rem 0' }}>
                  No posts analyzed yet
                </div>
              )}
              <div style={{ borderTop: '1px solid #334155', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {sentiment.analyzed} analyzed / {sentiment.unanalyzed} remaining
                  </span>
                </div>
                <button
                  onClick={runSentimentAnalysis}
                  disabled={analyzingsentiment || sentiment.unanalyzed === 0}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: analyzingsentiment ? '#475569' : sentiment.unanalyzed === 0 ? '#334155' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: sentiment.unanalyzed === 0 ? '#64748b' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: analyzingsentiment || sentiment.unanalyzed === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {analyzingsentiment ? 'Analyzing...' : sentiment.unanalyzed === 0 ? 'All Posts Analyzed' : `Analyze ${Math.min(sentiment.unanalyzed, 50)} Posts`}
                </button>
                {sentimentResult && !sentimentResult.error && (
                  <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.5rem', textAlign: 'center' }}>
                    Analyzed {sentimentResult.analyzed} posts
                  </div>
                )}
                {sentimentResult?.error && (
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem', textAlign: 'center' }}>
                    {sentimentResult.error}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Top Creators */}
          {topCreators.length > 0 && (
            <Card title="Top Creators" span={2} accent="#ef4444">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topCreators} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis type="category" dataKey="username" tick={{ fill: '#e2e8f0', fontSize: 12 }} width={120} tickFormatter={u => `@${u}`} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="posts" fill="#6366f1" name="Posts" />
                  <Bar dataKey="comments" fill="#22c55e" name="Comments" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
