import React, { useState } from 'react'
import axios from '../../api/axios.tsx'

const UserGenerator = () => {
  const [count, setCount] = useState(5)
  const [generateImages, setGenerateImages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    setLogs(['Starting user generation...'])

    try {
      const response = await axios.post(
        '/api/admin/generate-users',
        { count, generateImages }
      )

      const data = response.data
      setResults(data)
      setLogs(data.logs || [])

      if (!data.success) {
        setError(data.error || 'Generation failed')
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setError(msg)
      setLogs(prev => [...prev, `Error: ${msg}`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0f172a)',
      padding: '100px 1rem 2rem',
      color: 'var(--text-primary, #e2e8f0)'
    }}>
      <div style={{
        maxWidth: '720px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>&#x1F916;</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
              Synthetic User Generator
            </h1>
          </div>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            Generate AI-powered users with unique personas, profile pictures, and post histories.
          </p>
        </div>

        {/* Config Panel */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #334155'
        }}>
          {/* Count */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              Number of Users
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="range"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{
                background: '#6366f1',
                color: '#fff',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontWeight: '700',
                fontSize: '0.9rem',
                minWidth: '2.5rem',
                textAlign: 'center'
              }}>
                {count}
              </span>
            </div>
          </div>

          {/* Image Toggle */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}>
              <div
                onClick={() => setGenerateImages(!generateImages)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '999px',
                  background: generateImages ? '#6366f1' : '#475569',
                  position: 'relative',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: '3px',
                  left: generateImages ? '23px' : '3px',
                  transition: 'left 0.2s'
                }} />
              </div>
              <div>
                <span style={{ fontWeight: '600' }}>DALL-E Profile Photos</span>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {generateImages ? 'AI-generated photos (costs ~$0.04/image)' : 'Using free DiceBear avatars'}
                </div>
              </div>
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading
                ? '#475569'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s'
            }}
          >
            {loading ? 'Generating...' : `Generate ${count} User${count > 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#fca5a5',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {results && results.success && (
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              Results
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                flex: 1,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                  {results.created}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Created</div>
              </div>
              <div style={{
                flex: 1,
                background: results.errors > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                border: `1px solid ${results.errors > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                borderRadius: '8px',
                padding: '0.75rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: results.errors > 0 ? '#ef4444' : '#64748b' }}>
                  {results.errors}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Errors</div>
              </div>
            </div>

            {/* Created Users List */}
            {results.users && results.users.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Users Created</h4>
                {results.users.map((u, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: i < results.users.length - 1 ? '1px solid #334155' : 'none',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{ fontWeight: '500' }}>@{u.username}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      {u.postsCreated} posts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div style={{
            background: '#0f172a',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #334155',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Log</h4>
            {logs.map((log, i) => (
              <div key={i} style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: log.includes('Error') || log.includes('failed') ? '#fca5a5' : '#94a3b8',
                padding: '0.15rem 0'
              }}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserGenerator
