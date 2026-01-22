// ...existing code...
import axios from "../../api/axios.js";
import "./LandingPage.css";
import { useEffect, useState } from "react";
import { FaRegThumbsUp, FaThumbsUp, FaRegCommentDots, FaBookmark } from "react-icons/fa";

const LandingPage = () => {
  const [posts, setPosts] = useState([]);
  const [showCommentBox, setShowCommentBox] = useState(null); // postId or null
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("/api/posts");
        setPosts(response.data);
      } catch (err) {
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Get userId from localStorage
  const userId = Number(localStorage.getItem('userId'));

  // Like/unlike handler
  const handleLike = async (postId) => {
    if (!userId) return;
    try {
      await axios.post(`/api/posts/${postId}/like`, { userId });
      const updated = await axios.get("/api/posts");
      setPosts(updated.data);
    } catch (err) {}
  };

  // Save/unsave handler
  const handleSave = async (postId) => {
    if (!userId) return;
    try {
      await axios.post(`/api/savedPosts/${postId}/save`, { userId });
      const updated = await axios.get("/api/posts");
      setPosts(updated.data);
    } catch (err) {}
  };

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="centered-bg">
      <div className="feed-container">
        <h1 className="feed-title">Let's see what's up!</h1>
        <div className="posts-wrapper">
          {posts.map(post => {
            const likedByUser = post.likes?.some(like => like.userId === userId);
            return (
              <div key={post.id} className="post-card">
                <div className="post-author">{post.author?.username || "Unknown"}</div>
                <div className="post-content">{post.content}</div>
                <div className="post-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
                  <button
                    className="like-btn"
                    aria-label="Like"
                    onClick={() => handleLike(post.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {likedByUser ? (
                      <FaThumbsUp style={{ fontSize: '1.3rem', verticalAlign: 'middle', color: '#38bdf8' }} />
                    ) : (
                      <FaRegThumbsUp style={{ fontSize: '1.3rem', verticalAlign: 'middle' }} />
                    )}
                  </button>
                  <span className="like-count">{post.likes?.length || 0}</span>
                  <button
                    className="comment-btn"
                    aria-label="Comment"
                    onClick={() => setShowCommentBox(showCommentBox === post.id ? null : post.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <FaRegCommentDots style={{ fontSize: '1.3rem', verticalAlign: 'middle', color: '#38bdf8' }} />
                  </button>
                  <button
                    className="save-btn"
                    aria-label="Save"
                    onClick={() => handleSave(post.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {post.savedBy?.some(saved => saved.userId === userId) ? (
                      <FaBookmark style={{ fontSize: '1.3rem', verticalAlign: 'middle', color: '#fbbf24' }} />
                    ) : (
                      <FaBookmark style={{ fontSize: '1.3rem', verticalAlign: 'middle', color: '#fff' }} />
                    )}
                  </button>
                </div>
                {/* Media preview above comments */}
                {post.mediaUrl && post.mediaUrl.trim() !== "" && (
                  <div className="post-media" style={{ marginBottom: '1rem', width: '100%' }}>
                    <img src={post.mediaUrl} alt="Post media" style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
                  </div>
                )}
                {/* Comment box modal */}
                {showCommentBox === post.id && (
                  <div className="comment-modal" style={{ width: '100%', margin: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#18181b', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: '1rem' }}>
                    <textarea
                      className="comment-textbox"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Leave a comment..."
                      style={{ width: '95%', minHeight: '60px', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '1.05rem', background: '#23232a', color: '#fff', border: '1px solid #38bdf8' }}
                    />
                    <button
                      className="comment-submit-btn"
                      style={{ background: 'linear-gradient(90deg,#38bdf8,#2563eb)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.08rem', boxShadow: '0 2px 8px rgba(56,189,248,0.12)' }}
                      onClick={async () => {
                        if (!commentText.trim()) return;
                        await axios.post(`/api/comments/${post.id}/comment`, { userId, content: commentText });
                        setCommentText("");
                        setShowCommentBox(null);
                        // Refresh posts
                        const updated = await axios.get("/api/posts");
                        setPosts(updated.data);
                      }}
                    >Post</button>
                  </div>
                )}
                <div className="post-comments">
                  <strong>Comments:</strong>
                  <ul>
                    {post.comments?.map(comment => (
                      <li key={comment.id}><strong>{comment.author?.username || "Unknown"}:</strong> {comment.content}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
