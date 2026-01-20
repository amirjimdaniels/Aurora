import { useEffect, useState } from "react";
import axios from "../../api/axios.js";

const LandingPage = () => {
  const [posts, setPosts] = useState([]);
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

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="landing-page">
      <h1>Feed</h1>
      {posts.map(post => (
        <div key={post.id} className="post">
          <div><strong>{post.author?.username || "Unknown"}</strong></div>
          <div>{post.content}</div>
          <div>
            <button>Like ({post.likes?.length || 0})</button>
            <button>Save</button>
          </div>
          <div>
            <strong>Comments:</strong>
            <ul>
              {post.comments?.map(comment => (
                <li key={comment.id}><strong>{comment.author?.username || "Unknown"}:</strong> {comment.content}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LandingPage;
