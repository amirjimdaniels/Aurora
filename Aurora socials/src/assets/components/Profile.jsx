import axios from "../../api/axios.js";
import "./Profile.css";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaCamera, FaEdit, FaMapMarkerAlt, FaBirthdayCake, FaCalendarAlt, FaTimes } from "react-icons/fa";
import { RiUserFollowLine, RiUserUnfollowLine } from "react-icons/ri";
import PostCard from "./PostCard.jsx";

const Profile = () => {
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();
  const currentUserId = Number(localStorage.getItem('userId'));
  const profileUserId = paramUserId ? Number(paramUserId) : currentUserId;
  const isOwnProfile = profileUserId === currentUserId;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editProfilePic, setEditProfilePic] = useState("");
  const [editCoverPhoto, setEditCoverPhoto] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const profilePicInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [followModal, setFollowModal] = useState(null); // 'followers' or 'following' or null
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState([]);

  // Handle file selection for profile picture
  const handleProfilePicSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle file selection for cover photo
  const handleCoverPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditCoverPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileUserId || isNaN(profileUserId)) {
        // If no profile user ID and no current user, show login message
        if (!currentUserId || isNaN(currentUserId)) {
          setError("Please log in to view profile");
        } else {
          setError("User not found");
        }
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`/api/users/${profileUserId}`);
        setUser(response.data);
        setEditBio(response.data.bio || "");
        setEditBirthday(response.data.birthday || "");
        setEditLocation(response.data.location || "");
        setEditProfilePic(response.data.profilePicture || "");
        setEditCoverPhoto(response.data.coverPhoto || "");

        // Fetch follow counts
        try {
          const countsRes = await axios.get(`/api/follow/counts/${profileUserId}`);
          setFollowCounts(countsRes.data);
        } catch (err) {
          console.error('Failed to fetch follow counts');
        }

        // Check follow status if viewing someone else's profile
        if (!isOwnProfile && currentUserId) {
          try {
            const followRes = await axios.get(`/api/follow/status/${currentUserId}/${profileUserId}`);
            setIsFollowing(followRes.data.isFollowing);
          } catch (err) {
            setIsFollowing(false);
          }
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profileUserId, currentUserId, isOwnProfile]);

  const handleSaveProfile = async () => {
    try {
      await axios.put(`/api/users/${profileUserId}`, {
        bio: editBio,
        birthday: editBirthday,
        location: editLocation,
        profilePicture: editProfilePic,
        coverPhoto: editCoverPhoto
      });
      const response = await axios.get(`/api/users/${profileUserId}`);
      setUser(response.data);
      setEditMode(false);
      // Dispatch event to update Navbar profile picture
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err) {
      console.error("Failed to update profile");
    }
  };

  // Refresh user data (for PostCard callbacks)
  const refreshUserData = async () => {
    try {
      const response = await axios.get(`/api/users/${profileUserId}`);
      setUser(response.data);
    } catch (err) {}
  };

  // Follow handlers
  const handleFollow = async () => {
    try {
      await axios.post('/api/follow/follow', { followerId: currentUserId, followingId: profileUserId });
      setIsFollowing(true);
      setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.delete('/api/follow/unfollow', { data: { followerId: currentUserId, followingId: profileUserId } });
      setIsFollowing(false);
      setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  // Open followers/following modal
  const openFollowModal = async (type) => {
    setFollowModal(type);
    setLoadingFollowList(true);
    try {
      if (type === 'followers') {
        const res = await axios.get(`/api/follow/followers/${profileUserId}`);
        setFollowersList(res.data);
      } else {
        const res = await axios.get(`/api/follow/following/${profileUserId}`);
        setFollowingList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFollowList(false);
    }
  };

  if (loading) return <div className="profile-page"><div className="profile-container"><div>Loading profile...</div></div></div>;
  if (error) return <div className="profile-page"><div className="profile-container"><div>{error}</div></div></div>;
  if (!user) return <div className="profile-page"><div className="profile-container"><div>User not found</div></div></div>;

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        {/* Cover Photo */}
        <div className="cover-photo-container" style={{ position: 'relative' }}>
        {user.coverPhoto ? (
          <img src={user.coverPhoto} alt="Cover" className="cover-photo" />
        ) : (
          <div className="cover-photo-placeholder" />
        )}
        {isOwnProfile && (
          <>
            <input
              type="file"
              ref={coverPhotoInputRef}
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    try {
                      await axios.put(`/api/users/${profileUserId}`, {
                        coverPhoto: reader.result
                      });
                      const response = await axios.get(`/api/users/${profileUserId}`);
                      setUser(response.data);
                    } catch (err) {
                      console.error("Failed to update cover photo");
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{ display: 'none' }}
            />
            <button 
              className="add-cover-btn"
              onClick={() => coverPhotoInputRef.current?.click()}
              style={{ zIndex: 10 }}
            >
              <FaCamera /> {user.coverPhoto ? 'Change cover photo' : 'Add cover photo'}
            </button>
          </>
        )}
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-container">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.username} className="profile-avatar-large" />
          ) : (
            <div className="profile-avatar-large profile-avatar-placeholder">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          {isOwnProfile && (
            <>
              <input
                type="file"
                ref={profilePicInputRef}
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      try {
                        await axios.put(`/api/users/${profileUserId}`, {
                          profilePicture: reader.result
                        });
                        const response = await axios.get(`/api/users/${profileUserId}`);
                        setUser(response.data);
                        window.dispatchEvent(new Event('profileUpdated'));
                      } catch (err) {
                        console.error("Failed to update profile picture");
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => profilePicInputRef.current?.click()}
                title="Change profile picture"
                style={{
                  position: 'absolute',
                  bottom: '15px',
                  right: '15px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  padding: 0,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" style={{fill: '#ffffff'}}>
                  <path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 384c-53 0-96-43-96-96s43-96 96-96s96 43 96 96s-43 96-96 96z"/>
                </svg>
              </button>
            </>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{user.username}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
            <p className="profile-post-count" style={{ margin: 0 }}>{user._count?.posts || 0} posts</p>
            <p 
              onClick={() => openFollowModal('followers')}
              style={{ margin: 0, color: '#b0b3b8', fontSize: '0.95rem', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#e4e6eb'}
              onMouseOut={(e) => e.currentTarget.style.color = '#b0b3b8'}
            >
              <strong style={{ color: '#e4e6eb' }}>{followCounts.followers}</strong> followers
            </p>
            <p 
              onClick={() => openFollowModal('following')}
              style={{ margin: 0, color: '#b0b3b8', fontSize: '0.95rem', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#e4e6eb'}
              onMouseOut={(e) => e.currentTarget.style.color = '#b0b3b8'}
            >
              <strong style={{ color: '#e4e6eb' }}>{followCounts.following}</strong> following
            </p>
          </div>
        </div>
        {isOwnProfile ? (
          <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
            <FaEdit /> Edit profile
          </button>
        ) : (
          // Follow button for other users' profiles
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {isFollowing ? (
              <button
                className="edit-profile-btn"
                onClick={handleUnfollow}
                style={{ background: '#3a3b3c' }}
              >
                <RiUserUnfollowLine /> Following
              </button>
            ) : (
              <button
                className="edit-profile-btn"
                onClick={handleFollow}
                style={{ background: '#2078f4' }}
              >
                <RiUserFollowLine /> Follow
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editMode && (
        <div className="edit-modal-overlay" onClick={() => setEditMode(false)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            {/* Hidden file inputs */}
            <input
              type="file"
              ref={profilePicInputRef}
              accept="image/*"
              onChange={handleProfilePicSelect}
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={coverPhotoInputRef}
              accept="image/*"
              onChange={handleCoverPhotoSelect}
              style={{ display: 'none' }}
            />
            <label>
              Profile Picture
              <div
                onClick={() => profilePicInputRef.current?.click()}
                style={{
                  marginTop: '8px', padding: '12px', background: '#0f172a', border: '1px dashed #334155',
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'center', color: '#94a3b8'
                }}
              >
                {editProfilePic ? (
                  <img src={editProfilePic} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px' }} />
                ) : (
                  <span>Click to select profile picture</span>
                )}
              </div>
            </label>
            <label>
              Cover Photo
              <div
                onClick={() => coverPhotoInputRef.current?.click()}
                style={{
                  marginTop: '8px', padding: '12px', background: '#0f172a', border: '1px dashed #334155',
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'center', color: '#94a3b8'
                }}
              >
                {editCoverPhoto ? (
                  <img src={editCoverPhoto} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px' }} />
                ) : (
                  <span>Click to select cover photo</span>
                )}
              </div>
            </label>
            <label>
              Bio
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </label>
            <label>
              Birthday
              <input
                type="date"
                value={editBirthday}
                onChange={e => setEditBirthday(e.target.value)}
              />
            </label>
            <label>
              Location
              <input
                type="text"
                value={editLocation}
                onChange={e => setEditLocation(e.target.value)}
                placeholder="City, Country"
              />
            </label>
            <div className="edit-modal-actions">
              <button className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
              <button className="save-btn" onClick={handleSaveProfile}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Content */}
      <div className="profile-content">
        {/* Left Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-card">
            <h3>About</h3>
            {user.bio ? (
              <p className="bio-text">{user.bio}</p>
            ) : isOwnProfile ? (
              <button className="add-bio-btn" onClick={() => setEditMode(true)}>Add bio</button>
            ) : (
              <p className="no-bio">No bio yet</p>
            )}
          </div>

          <div className="profile-card">
            <h3>Personal Details</h3>
            {user.birthday && (
              <p className="detail-item">
                <FaBirthdayCake style={{ color: '#38bdf8' }} /> {new Date(user.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            {user.location && (
              <p className="detail-item">
                <FaMapMarkerAlt style={{ color: '#ef4444' }} /> {user.location}
              </p>
            )}
            <p className="detail-item">
              <FaCalendarAlt style={{ color: '#4ade80' }} /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              Posts
            </button>
            <button
              className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button
              className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
              onClick={() => setActiveTab('photos')}
            >
              Photos
            </button>
          </div>

          {/* Posts */}
          {activeTab === 'posts' && (
            <div className="profile-posts">
              {user.posts?.length === 0 ? (
                <div className="no-posts">
                  <p>No posts yet</p>
                </div>
              ) : (
                user.posts?.map(post => (
                  <PostCard 
                    key={post.id}
                    post={{
                      ...post,
                      author: { id: user.id, username: user.username, profilePicture: user.profilePicture }
                    }}
                    currentUserId={currentUserId}
                    onPostUpdate={refreshUserData}
                    showDeleteButton={isOwnProfile}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="profile-about-tab">
              <div className="about-section">
                <h3>Bio</h3>
                <p>{user.bio || 'No bio provided'}</p>
              </div>
              <div className="about-section">
                <h3>Details</h3>
                {user.birthday && <p><FaBirthdayCake /> Birthday: {new Date(user.birthday).toLocaleDateString()}</p>}
                {user.location && <p><FaMapMarkerAlt /> Lives in: {user.location}</p>}
                {user.email && <p>Email: {user.email}</p>}
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="profile-photos-tab">
              <div className="photos-grid">
                {user.posts?.filter(p => p.mediaUrl && p.mediaUrl.trim() !== "").length === 0 ? (
                  <p className="no-photos">No photos yet</p>
                ) : (
                  user.posts?.filter(p => p.mediaUrl && p.mediaUrl.trim() !== "").map(post => (
                    <div key={post.id} className="photo-item">
                      <img src={post.mediaUrl} alt="Post" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Followers/Following Modal */}
      {followModal && (
        <div 
          onClick={() => setFollowModal(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#242526', borderRadius: '12px', width: '400px', maxWidth: '90vw',
              maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1rem', borderBottom: '1px solid #3a3b3c',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, color: '#e4e6eb', fontSize: '1.25rem' }}>
                {followModal === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <button
                onClick={() => setFollowModal(null)}
                style={{
                  background: '#3a3b3c', border: 'none', color: '#e4e6eb',
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  fontSize: '1.2rem', fontWeight: 'bold', transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#4a4b4c'}
                onMouseOut={(e) => e.currentTarget.style.background = '#3a3b3c'}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
              {loadingFollowList ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#b0b3b8' }}>Loading...</div>
              ) : (
                <>
                  {(followModal === 'followers' ? followersList : followingList).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#b0b3b8' }}>
                      {followModal === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                    </div>
                  ) : (
                    (followModal === 'followers' ? followersList : followingList).map(person => (
                      <div
                        key={person.id}
                        onClick={() => { setFollowModal(null); navigate(`/profile/${person.id}`); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem', borderRadius: '8px', cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#3a3b3c'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '50%',
                          background: person.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden', fontSize: '1.25rem', fontWeight: '600', color: '#fff', flexShrink: 0
                        }}>
                          {person.profilePicture ? (
                            <img src={person.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : person.username?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, color: '#e4e6eb', fontWeight: '600' }}>{person.username}</p>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Profile;
