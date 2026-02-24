import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaUsers, FaImages, FaCompass, FaHeart, FaCommentDots, FaPoll, FaBolt, FaShieldAlt, FaArrowRight } from 'react-icons/fa';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #050a14 0%, #0a1020 50%, #0f172a 100%)', color: '#f1f5f9', overflowX: 'hidden' }}>

      {/* Animated Aurora Background */}
      <div style={{
        position: 'fixed', top: '-50%', left: '-25%', width: '150%', height: '150%',
        background: 'radial-gradient(ellipse at 30% 20%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(139, 92, 246, 0.1) 0%, transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(236, 72, 153, 0.07) 0%, transparent 40%)',
        animation: 'aurora-drift 20s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* ===== HERO SECTION ===== */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '2rem 1.5rem',
        position: 'relative', zIndex: 1
      }}>
        {/* Logo */}
        {!logoError ? (
          <img
            src="/Aurorav3.png"
            alt="Aurora"
            onError={() => setLogoError(true)}
            style={{
              width: '140px', height: '140px', objectFit: 'contain',
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.4))',
              animation: 'float 6s ease-in-out infinite'
            }}
          />
        ) : (
          <div style={{
            width: '140px', height: '140px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', fontWeight: '800', color: '#fff',
            marginBottom: '1.5rem',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.4)'
          }}>A</div>
        )}

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 1rem 0',
          lineHeight: 1.1,
          letterSpacing: '-0.02em'
        }}>
          Aurora Social
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          color: '#94a3b8',
          maxWidth: '600px',
          margin: '0 0 2.5rem 0',
          lineHeight: 1.5
        }}>
          Where conversations come alive. Share moments, connect with friends, and discover what's trending.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
              border: 'none', color: '#fff',
              padding: '1rem 2.5rem', borderRadius: '14px',
              fontSize: '1.1rem', fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(139, 92, 246, 0.3)'; }}
          >
            Get Started <FaArrowRight />
          </button>
          <button
            onClick={() => navigate('/signin')}
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)', color: '#a78bfa',
              padding: '1rem 2.5rem', borderRadius: '14px',
              fontSize: '1.1rem', fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'; }}
          >
            Sign In
          </button>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '2rem',
          animation: 'float 3s ease-in-out infinite',
          color: '#64748b', fontSize: '0.85rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
        }}>
          <span>Scroll to explore</span>
          <div style={{
            width: '24px', height: '40px', borderRadius: '12px',
            border: '2px solid #64748b', position: 'relative'
          }}>
            <div style={{
              width: '4px', height: '8px', borderRadius: '2px',
              background: '#64748b', position: 'absolute',
              top: '8px', left: '50%', transform: 'translateX(-50%)',
              animation: 'scrollBounce 2s ease-in-out infinite'
            }} />
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section style={{
        padding: '6rem 1.5rem',
        maxWidth: '1100px', margin: '0 auto',
        position: 'relative', zIndex: 1
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem'
        }}>
          Everything you need
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '1.1rem', marginBottom: '4rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          A social platform built for real connection — not noise.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            { icon: <FaUsers />, color: '#06b6d4', title: 'Connect', desc: 'Follow friends, message in real-time, and build your community with mutual connections.' },
            { icon: <FaImages />, color: '#8b5cf6', title: 'Express', desc: 'Share posts with photos, videos, GIFs, polls, and reactions that go beyond a simple like.' },
            { icon: <FaCompass />, color: '#ec4899', title: 'Discover', desc: 'Explore trending hashtags, stories, and meet new people through the For You feed.' },
          ].map((feature, i) => (
            <div key={i} style={{
              background: 'linear-gradient(145deg, rgba(19, 28, 46, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              border: '1px solid rgba(139, 92, 246, 0.12)',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${feature.color}40`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 50px ${feature.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.12)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: `${feature.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', color: feature.color,
                marginBottom: '1.25rem'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.75rem' }}>
                {feature.title}
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PLATFORM PREVIEW SECTION ===== */}
      <section style={{
        padding: '4rem 1.5rem 6rem',
        maxWidth: '900px', margin: '0 auto',
        position: 'relative', zIndex: 1
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: '700',
          color: '#e2e8f0',
          marginBottom: '1rem'
        }}>
          Built for <span style={{
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>you</span>
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '1.1rem', marginBottom: '3rem' }}>
          A beautiful dark-themed experience with everything you'd expect — and more.
        </p>

        {/* Feature highlights as pills */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem',
          marginBottom: '3rem'
        }}>
          {[
            { icon: <FaHeart />, label: 'Reactions', color: '#f43f5e' },
            { icon: <FaCommentDots />, label: 'Real-time Chat', color: '#06b6d4' },
            { icon: <FaPoll />, label: 'Polls', color: '#8b5cf6' },
            { icon: <FaBolt />, label: 'Stories', color: '#f59e0b' },
            { icon: <FaShieldAlt />, label: 'Private & Secure', color: '#10b981' },
          ].map((pill, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.25rem', borderRadius: '100px',
              background: `${pill.color}12`,
              border: `1px solid ${pill.color}25`,
              color: pill.color, fontSize: '0.9rem', fontWeight: '500'
            }}>
              {pill.icon} {pill.label}
            </div>
          ))}
        </div>

        {/* Mock post card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(19, 28, 46, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          padding: '1.5rem',
          maxWidth: '520px', margin: '0 auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 80px rgba(139, 92, 246, 0.06)'
        }}>
          {/* Post header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '700', fontSize: '1.1rem'
            }}>A</div>
            <div>
              <div style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem' }}>AuroraUser</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Just now</div>
            </div>
          </div>
          {/* Post content */}
          <p style={{ color: '#e2e8f0', lineHeight: 1.6, marginBottom: '1rem', fontSize: '0.95rem' }}>
            Just joined Aurora Social and the vibe here is unreal. The dark theme + aurora effects are gorgeous. Anyone else obsessed? <span style={{ color: '#8b5cf6' }}>#AuroraSocial</span> <span style={{ color: '#06b6d4' }}>#NewHere</span>
          </p>
          {/* Fake engagement bar */}
          <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', fontSize: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <span>24 likes</span>
            <span>8 comments</span>
            <span style={{ marginLeft: 'auto' }}>3 reactions</span>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA SECTION ===== */}
      <section style={{
        padding: '5rem 1.5rem 3rem',
        textAlign: 'center',
        position: 'relative', zIndex: 1
      }}>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: '700',
          color: '#e2e8f0',
          marginBottom: '1rem'
        }}>
          Ready to join?
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '2rem' }}>
          Create your account in seconds. It's free.
        </p>
        <button
          onClick={() => navigate('/register')}
          style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
            border: 'none', color: '#fff',
            padding: '1rem 3rem', borderRadius: '14px',
            fontSize: '1.1rem', fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(139, 92, 246, 0.3)',
            transition: 'all 0.3s ease',
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(139, 92, 246, 0.3)'; }}
        >
          Get Started <FaArrowRight />
        </button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        padding: '2rem 1.5rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(139, 92, 246, 0.1)',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <span onClick={() => navigate('/signin')} style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >Sign In</span>
          <span onClick={() => navigate('/register')} style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >Register</span>
        </div>
        <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0 }}>
          Aurora Social &copy; {new Date().getFullYear()}
        </p>
      </footer>

      {/* Keyframe animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          50% { transform: translateX(-50%) translateY(12px); opacity: 0.3; }
        }
        @keyframes aurora-drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-3%, -2%) rotate(2deg); }
          66% { transform: translate(2%, 1%) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
