import { useState, useEffect, useRef } from "react";
import axios from "../../api/axios.js";
import { FaPlus, FaTimes, FaChevronLeft, FaChevronRight, FaEye, FaImage, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Stories = ({ showCreateModal, onCloseCreateModal, hideAddButton }) => {
  const navigate = useNavigate();
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingStory, setViewingStory] = useState(null); // { groupIndex, storyIndex }
  const [showCreate, setShowCreate] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState(null);
  const [newStoryCaption, setNewStoryCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const userId = Number(localStorage.getItem('userId'));
  const username = localStorage.getItem('username');
  const userProfilePicture = localStorage.getItem('profilePicture');

  // Sync external modal state
  useEffect(() => {
    if (showCreateModal) {
      setShowCreate(true);
    }
  }, [showCreateModal]);

  // Handle closing create modal
  const handleCloseCreate = () => {
    setShowCreate(false);
    setNewStoryMedia(null);
    setNewStoryCaption("");
    if (onCloseCreateModal) onCloseCreateModal();
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/stories/feed/${userId}`);
      setStoryGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStoryMedia(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const createStory = async () => {
    if (!newStoryMedia) return;
    
    try {
      setUploading(true);
      await axios.post('/api/stories', {
        userId,
        mediaUrl: newStoryMedia,
        caption: newStoryCaption
      });
      
      handleCloseCreate();
      fetchStories();
    } catch (error) {
      console.error('Failed to create story:', error);
    } finally {
      setUploading(false);
    }
  };

  const viewStory = async (groupIndex, storyIndex = 0) => {
    setViewingStory({ groupIndex, storyIndex });
    setProgress(0);
    setShowViewers(false);
    
    const story = storyGroups[groupIndex].stories[storyIndex];
    
    // Mark as viewed
    try {
      await axios.post(`/api/stories/${story.id}/view`, { userId });
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
    
    // Auto-progress
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          goToNextStory();
          return 0;
        }
        return prev + 2; // 5 seconds per story (100 / 20 intervals * 100ms)
      });
    }, 100);
  };

  const goToNextStory = () => {
    if (!viewingStory) return;
    
    clearInterval(progressIntervalRef.current);
    
    const { groupIndex, storyIndex } = viewingStory;
    const currentGroup = storyGroups[groupIndex];
    
    if (storyIndex < currentGroup.stories.length - 1) {
      // Next story in same group
      viewStory(groupIndex, storyIndex + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      // Next group
      viewStory(groupIndex + 1, 0);
    } else {
      // End of all stories
      closeStoryViewer();
    }
  };

  const goToPrevStory = () => {
    if (!viewingStory) return;
    
    clearInterval(progressIntervalRef.current);
    
    const { groupIndex, storyIndex } = viewingStory;
    
    if (storyIndex > 0) {
      // Previous story in same group
      viewStory(groupIndex, storyIndex - 1);
    } else if (groupIndex > 0) {
      // Previous group (last story)
      const prevGroup = storyGroups[groupIndex - 1];
      viewStory(groupIndex - 1, prevGroup.stories.length - 1);
    }
  };

  const closeStoryViewer = () => {
    clearInterval(progressIntervalRef.current);
    setViewingStory(null);
    setProgress(0);
    setShowViewers(false);
    fetchStories(); // Refresh to update viewed status
  };

  const fetchViewers = async (storyId) => {
    try {
      const response = await axios.get(`/api/stories/${storyId}/viewers`);
      setViewers(response.data);
      setShowViewers(true);
    } catch (error) {
      console.error('Failed to fetch viewers:', error);
    }
  };

  const deleteStory = async (storyId) => {
    try {
      await axios.delete(`/api/stories/${storyId}`, { data: { userId } });
      closeStoryViewer();
      fetchStories();
    } catch (error) {
      console.error('Failed to delete story:', error);
    }
  };

  const getTimeAgo = (dateString) => {
    const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const currentStoryData = viewingStory ? {
    group: storyGroups[viewingStory.groupIndex],
    story: storyGroups[viewingStory.groupIndex]?.stories[viewingStory.storyIndex]
  } : null;

  return (
    <>
      {/* Stories Row */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.75rem 0',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        marginBottom: '0.5rem'
      }}>
        {/* Add Story Button - only show if hideAddButton is not true */}
        {!hideAddButton && (
          <div
            onClick={() => setShowCreate(true)}
            style={{
              minWidth: '90px',
              height: '130px',
              borderRadius: '16px',
              background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              border: '2px dashed #475569',
              transition: 'all 0.2s ease',
              gap: '0.5rem'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.background = 'linear-gradient(145deg, #1e3a5f 0%, #0f172a 100%)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#475569';
              e.currentTarget.style.background = 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)';
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
          }}>
            <FaPlus style={{ color: '#fff', fontSize: '1rem' }} />
          </div>
          <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Create Story</span>
        </div>
        )}

        {/* Story Circles */}
        {loading ? (
          <div style={{ padding: '2rem', color: '#64748b' }}>Loading...</div>
        ) : (
          storyGroups.map((group, idx) => (
            <div
              key={group.author.id}
              onClick={() => viewStory(idx, 0)}
              style={{
                minWidth: '90px',
                height: '130px',
                borderRadius: '16px',
                background: `url(${group.stories[0].mediaUrl}) center/cover`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                border: group.hasUnviewed ? '3px solid #38bdf8' : '2px solid #334155',
                boxShadow: group.hasUnviewed ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.7))'
              }} />
              
              {/* Avatar */}
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: group.hasUnviewed ? '2px solid #38bdf8' : '2px solid #475569',
                background: group.author.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {group.author.profilePicture ? (
                  <img src={group.author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>
                    {group.author.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Username */}
              <span style={{
                color: '#fff',
                fontSize: '0.65rem',
                marginBottom: '0.5rem',
                zIndex: 1,
                maxWidth: '70px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {group.author.id === userId ? 'Your Story' : group.author.username}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Create Story Modal */}
      {showCreate && (
        <div
          onClick={handleCloseCreate}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e293b',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#e2e8f0', margin: 0 }}>Create Story</h3>
              <button
                onClick={handleCloseCreate}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <FaTimes />
              </button>
            </div>

            {!newStoryMedia ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #334155',
                  borderRadius: '12px',
                  padding: '3rem',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <FaImage style={{ fontSize: '2rem', color: '#64748b', marginBottom: '0.5rem' }} />
                <p style={{ color: '#94a3b8', margin: 0 }}>Click to upload image</p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={newStoryMedia}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'cover',
                    borderRadius: '12px'
                  }}
                />
                <button
                  onClick={() => setNewStoryMedia(null)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <FaTimes />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <input
              type="text"
              value={newStoryCaption}
              onChange={e => setNewStoryCaption(e.target.value)}
              placeholder="Add a caption..."
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <button
              onClick={createStory}
              disabled={!newStoryMedia || uploading}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1rem',
                background: newStoryMedia ? '#38bdf8' : '#334155',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: '600',
                cursor: newStoryMedia ? 'pointer' : 'default',
                opacity: uploading ? 0.7 : 1
              }}
            >
              {uploading ? 'Sharing...' : 'Share to Story'}
            </button>
          </div>
        </div>
      )}

      {/* Story Viewer */}
      {viewingStory && currentStoryData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Progress bars */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px',
            zIndex: 10
          }}>
            {currentStoryData.group.stories.map((story, idx) => (
              <div
                key={story.id}
                style={{
                  flex: 1,
                  height: '3px',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  height: '100%',
                  background: '#fff',
                  width: idx < viewingStory.storyIndex ? '100%' :
                         idx === viewingStory.storyIndex ? `${progress}%` : '0%',
                  transition: 'width 0.1s linear'
                }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10
          }}>
            <div
              onClick={() => navigate(`/profile/${currentStoryData.group.author.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: currentStoryData.group.author.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {currentStoryData.group.author.profilePicture ? (
                  <img src={currentStoryData.group.author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#fff', fontWeight: '600' }}>
                    {currentStoryData.group.author.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>
                  {currentStoryData.group.author.username}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                  {getTimeAgo(currentStoryData.story.createdAt)}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {currentStoryData.group.author.id === userId && (
                <button
                  onClick={() => deleteStory(currentStoryData.story.id)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <FaTrash style={{ fontSize: '0.9rem' }} />
                </button>
              )}
              <button
                onClick={closeStoryViewer}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <FaTimes style={{ fontSize: '1rem' }} />
              </button>
            </div>
          </div>

          {/* Story Content */}
          <img
            src={currentStoryData.story.mediaUrl}
            alt="Story"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />

          {/* Caption */}
          {currentStoryData.story.caption && (
            <div style={{
              position: 'absolute',
              bottom: '80px',
              left: '12px',
              right: '12px',
              textAlign: 'center',
              color: '#fff',
              fontSize: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {currentStoryData.story.caption}
            </div>
          )}

          {/* Navigation areas */}
          <div
            onClick={goToPrevStory}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '30%',
              cursor: 'pointer'
            }}
          />
          <div
            onClick={goToNextStory}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '30%',
              cursor: 'pointer'
            }}
          />

          {/* Viewers count (for own stories) */}
          {currentStoryData.group.author.id === userId && (
            <div
              onClick={() => fetchViewers(currentStoryData.story.id)}
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              <FaEye />
              <span>{currentStoryData.story.viewCount || 0}</span>
            </div>
          )}

          {/* Viewers list */}
          {showViewers && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1e293b',
                borderRadius: '12px',
                padding: '1rem',
                maxHeight: '200px',
                overflowY: 'auto',
                minWidth: '200px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.75rem',
                borderBottom: '1px solid #334155',
                paddingBottom: '0.5rem'
              }}>
                <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Viewers</span>
                <button
                  onClick={() => setShowViewers(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <FaTimes />
                </button>
              </div>
              {viewers.length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No viewers yet</div>
              ) : (
                viewers.map(viewer => (
                  <div
                    key={viewer.id}
                    onClick={() => { closeStoryViewer(); navigate(`/profile/${viewer.id}`); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: viewer.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {viewer.profilePicture ? (
                        <img src={viewer.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: '600' }}>
                          {viewer.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{viewer.username}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Stories;
