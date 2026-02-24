import axios from "../../api/axios.tsx";
import "./LandingPage.css";
import { useEffect, useState } from "react";
import { FaBookmark } from "react-icons/fa";
import PostCard from "./PostCard.tsx";

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = Number(localStorage.getItem('userId'));

  const fetchSavedPosts = async () => {
    if (!userId) {
      setError("Please log in to view saved posts");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`/api/savedPosts/user/${userId}`);
      setSavedPosts(response.data);
    } catch (err) {
      setError("Failed to load saved posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, [userId]);

  if (loading) return <div className="centered-bg"><div className="feed-container"><div>Loading saved posts...</div></div></div>;
  if (error) return <div className="centered-bg"><div className="feed-container"><div>{error}</div></div></div>;

  return (
    <div className="centered-bg">
      <div className="feed-container">
        <h1 className="feed-title">
          <FaBookmark style={{ color: '#fbbf24', marginRight: '0.5rem' }} />
          Saved Posts
        </h1>
        <div className="posts-wrapper">
          {savedPosts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>
              <p>You haven't saved any posts yet.</p>
              <p style={{ fontSize: '0.9rem' }}>Click the bookmark icon on posts to save them here!</p>
            </div>
          ) : (
            savedPosts.map(savedPost => (
              <PostCard 
                key={savedPost.post.id}
                post={savedPost.post}
                currentUserId={userId}
                onPostUpdate={fetchSavedPosts}
                showDeleteButton={false}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPosts;
