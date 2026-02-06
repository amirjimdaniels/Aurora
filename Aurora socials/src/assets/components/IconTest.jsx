import { FaTimes, FaTrash, FaCheck, FaHome, FaUser, FaHeart, FaComment, FaShare, FaBookmark } from "react-icons/fa";
import { IoSend, IoChatbubbleEllipses } from "react-icons/io5";

const IconTest = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a', 
      padding: '2rem',
      color: '#e2e8f0'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>Icon Test Page</h1>
      
      {/* Test 1: Basic icons with no styling */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
        <h3>Test 1: Raw icons (no styling)</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <FaTimes />
          <FaTrash />
          <FaCheck />
          <FaHome />
          <FaUser />
          <IoSend />
        </div>
      </div>

      {/* Test 2: Icons with size prop */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
        <h3>Test 2: Icons with size prop (size=24)</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <FaTimes size={24} />
          <FaTrash size={24} />
          <FaCheck size={24} />
          <FaHome size={24} />
          <FaUser size={24} />
          <IoSend size={24} />
        </div>
      </div>

      {/* Test 3: Icons with color prop */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
        <h3>Test 3: Icons with color prop (color="#ef4444")</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <FaTimes color="#ef4444" />
          <FaTrash color="#ef4444" />
          <FaCheck color="#ef4444" />
          <FaHome color="#ef4444" />
          <FaUser color="#ef4444" />
          <IoSend color="#ef4444" />
        </div>
      </div>

      {/* Test 4: Icons with inline style */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
        <h3>Test 4: Icons with inline style (fontSize + color)</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <FaTimes style={{ fontSize: '24px', color: '#22c55e' }} />
          <FaTrash style={{ fontSize: '24px', color: '#22c55e' }} />
          <FaCheck style={{ fontSize: '24px', color: '#22c55e' }} />
          <FaHome style={{ fontSize: '24px', color: '#22c55e' }} />
          <FaUser style={{ fontSize: '24px', color: '#22c55e' }} />
          <IoSend style={{ fontSize: '24px', color: '#22c55e' }} />
        </div>
      </div>

      {/* Test 5: Icons inside buttons */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
        <h3>Test 5: Icons inside buttons (with size prop + padding:0)</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button style={{ 
            background: '#3a3b3c', border: 'none', color: '#e4e6eb',
            width: '36px', height: '36px', borderRadius: '50%', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            overflow: 'visible'
          }}>
            <FaTimes size={18} />
          </button>
          <button style={{ 
            background: '#3a3b3c', border: 'none', color: '#e4e6eb',
            width: '36px', height: '36px', borderRadius: '50%', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            overflow: 'visible'
          }}>
            <FaTrash size={18} />
          </button>
          <button style={{ 
            background: '#2563eb', border: 'none', color: '#fff',
            width: '36px', height: '36px', borderRadius: '50%', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            overflow: 'visible'
          }}>
            <IoSend size={16} />
          </button>
        </div>
      </div>

      {/* Test 6: Icons inside buttons with SVG className */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
        <h3>Test 6: Icons with className approach</h3>
        <style>{`
          .icon-visible svg {
            width: 18px !important;
            height: 18px !important;
            fill: currentColor !important;
          }
        `}</style>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button className="icon-visible" style={{ 
            background: '#3a3b3c', border: 'none', color: '#e4e6eb', padding: 0,
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <FaTimes />
          </button>
          <button className="icon-visible" style={{ 
            background: '#3a3b3c', border: 'none', color: '#ef4444', padding: 0,
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <FaTrash />
          </button>
          <button className="icon-visible" style={{ 
            background: '#2563eb', border: 'none', color: '#fff', padding: 0,
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <IoSend />
          </button>
        </div>
      </div>

      {/* Test 7: Pure SVG test */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
        <h3>Test 7: Pure inline SVG (not react-icons)</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button style={{ 
            background: '#3a3b3c', border: 'none', color: '#e4e6eb', padding: 0,
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <button style={{ 
            background: '#3a3b3c', border: 'none', color: '#ef4444', padding: 0,
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
          <button style={{ 
            background: '#2563eb', border: 'none', color: '#fff', padding: 0,
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Test 8: Icons inside DIVs instead of buttons */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
        <h3>Test 8: Icons inside DIVs (not buttons)</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ 
            background: '#3a3b3c', color: '#e4e6eb',
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <FaTimes size={18} />
          </div>
          <div style={{ 
            background: '#3a3b3c', color: '#ef4444',
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <FaTrash size={18} />
          </div>
          <div style={{ 
            background: '#2563eb', color: '#fff',
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <IoSend size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconTest;
