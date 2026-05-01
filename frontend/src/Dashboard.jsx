import { useEffect, useState } from "react";
import axios from "axios";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import { useNavigate } from "react-router-dom";
import "./App.css";

const API_BASE = "https://circle-of-hope-backend.onrender.com";

const topics = [
  { title: "Autism Support", icon: "🧩" },
  { title: "Behavior Tips", icon: "🧠" },
  { title: "School Help", icon: "🏫" },
  { title: "Community Stories", icon: "💬" },
];

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [stories, setStories] = useState([]);
  const [storyText, setStoryText] = useState("");
  const [storyImage, setStoryImage] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);

  const [anonymousQuestions, setAnonymousQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser) {
      navigate("/");
      return;
    }

    setUser(savedUser);
  }, [navigate]);

  useEffect(() => {
    fetchAnonymousQuestions();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchPosts(user.id);
      fetchStories(user.id);
    }
  }, [user]);

  const fetchPosts = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/feed/${id}`);

      setPosts(
        res.data.map((p) => ({
          ...p,
          comments: p.comments || [],
          likes_count: p.likes_count || 0,
        }))
      );
    } catch (err) {
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/stories/${id}`);
      setStories(res.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const fetchAnonymousQuestions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/anonymous-questions`);
      setAnonymousQuestions(res.data);
    } catch (err) {
      console.error("Error fetching anonymous questions:", err);
    }
  };

  const handleAddAnonymousQuestion = async (e) => {
    e.preventDefault();

    if (!newQuestion.trim()) {
      alert("Please write a question first");
      return;
    }

    try {
      await axios.post(`${API_BASE}/anonymous-questions`, {
        question: newQuestion,
      });

      setNewQuestion("");
      fetchAnonymousQuestions();
    } catch (err) {
      console.error("Error adding anonymous question:", err);
      alert("Failed to add question");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPostImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePost = async (e) => {
    e.preventDefault();

    if (!newPost.trim() && !postImage) return;

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("content", newPost);

      if (postImage) {
        formData.append("image", postImage);
      }

      await axios.post(`${API_BASE}/posts-with-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewPost("");
      setPostImage(null);
      setImagePreview("");
      fetchPosts(user.id);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleStoryImage = (e) => {
    const file = e.target.files[0];
    if (file) setStoryImage(file);
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();

    if (!storyText.trim() && !storyImage) return;

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("text", storyText);

      if (storyImage) {
        formData.append("image", storyImage);
      }

      await axios.post(`${API_BASE}/stories`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStoryText("");
      setStoryImage(null);
      fetchStories(user.id);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleDeleteStory = async (id) => {
    try {
      await axios.delete(`${API_BASE}/stories/${id}`, {
        data: { userId: user.id },
      });

      setSelectedStory(null);
      fetchStories(user.id);
    } catch (err) {
      alert(err.response?.data?.message || "Not allowed");
    }
  };

  const handleLike = async (id) => {
    try {
      await axios.post(`${API_BASE}/posts/${id}/like`, {
        userId: user.id,
      });

      fetchPosts(user.id);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId];

    if (!text) return;

    try {
      await axios.post(`${API_BASE}/posts/${postId}/comments`, {
        userId: user.id,
        content: text,
      });

      setCommentInputs((p) => ({ ...p, [postId]: "" }));
      fetchPosts(user.id);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await axios.delete(`${API_BASE}/posts/${id}`, {
        data: { userId: user.id },
      });

      fetchPosts(user.id);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleDeleteComment = async (id) => {
    try {
      await axios.delete(`${API_BASE}/comments/${id}`);
      fetchPosts(user.id);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const filtered = posts.filter((p) =>
    p.content?.toLowerCase().includes(search.toLowerCase())
  );

  const totalComments = posts.reduce(
    (a, b) => a + (b.comments?.length || 0),
    0
  );

  const totalLikes = posts.reduce((a, b) => a + (b.likes_count || 0), 0);

  if (!user) return null;

  return (
    <>
      <Topbar />

      <div className="main-layout">
        <Sidebar />

        <div className="feed">
          <div className="hero">
            <div>
              <h1>Welcome {user.name}</h1>
              <p>Connect with parents and specialists and share knowledge.</p>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="stats">
            <div>Posts: {posts.length}</div>
            <div>Comments: {totalComments}</div>
            <div>Likes: {totalLikes}</div>
          </div>

          <section className="stories-section">
            <div className="stories-header">
              <h2>Stories</h2>
              <span>Visible for 24 hours</span>
            </div>

            <form className="story-create-box" onSubmit={handleCreateStory}>
              <input
                type="text"
                placeholder="Share a quick story..."
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
              />

              <label className="story-image-btn">
                📷
                <input type="file" accept="image/*" onChange={handleStoryImage} />
              </label>

              <button type="submit">Add Story</button>
            </form>

            <div className="stories-row">
              {stories.length === 0 ? (
                <p className="empty-stories">No stories yet.</p>
              ) : (
                stories.map((story) => (
                  <div
                    key={story.id}
                    className="story-circle-card"
                    onClick={() => setSelectedStory(story)}
                  >
                    <div className="story-ring">
                      <img
                        src={
                          story.image
                            ? `${API_BASE}${story.image}`
                            : story.profile_pic
                            ? `${API_BASE}${story.profile_pic}`
                            : "https://via.placeholder.com/80"
                        }
                        alt="story"
                      />
                    </div>
                    <span>{story.name}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {selectedStory && (
            <div className="story-modal" onClick={() => setSelectedStory(null)}>
              <div className="story-view" onClick={(e) => e.stopPropagation()}>
                <button
                  className="story-close"
                  onClick={() => setSelectedStory(null)}
                >
                  ×
                </button>

                <div className="story-owner">
                  <img
                    src={
                      selectedStory.profile_pic
                        ? `${API_BASE}${selectedStory.profile_pic}`
                        : "https://via.placeholder.com/45"
                    }
                    alt="owner"
                  />
                  <div>
                    <strong>{selectedStory.name}</strong>
                    <span>{selectedStory.role}</span>
                  </div>
                </div>

                {selectedStory.image && (
                  <img
                    className="story-big-image"
                    src={`${API_BASE}${selectedStory.image}`}
                    alt="story"
                  />
                )}

                {selectedStory.text && <p>{selectedStory.text}</p>}

                {selectedStory.user_id === user.id && (
                  <button
                    className="danger-btn"
                    onClick={() => handleDeleteStory(selectedStory.id)}
                  >
                    Delete Story
                  </button>
                )}
              </div>
            </div>
          )}

          <section className="anonymous-box">
            <h2>Anonymous Questions</h2>
            <p>Parents can ask questions anonymously. Everyone can see them.</p>

            {user?.role?.toLowerCase() === "parent" && (
              <form onSubmit={handleAddAnonymousQuestion}>
                <textarea
                  placeholder="Write your anonymous question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                />

                <button type="submit" className="login-btn">
                  Add Question
                </button>
              </form>
            )}

            <div className="anonymous-list">
              {anonymousQuestions.length === 0 ? (
                <p>No questions yet.</p>
              ) : (
                anonymousQuestions.map((item) => (
                  <div key={item.id} className="anonymous-card">
                    <strong>Anonymous Parent</strong>
                    <p>{item.question}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="topics">
            {topics.map((t) => (
              <div key={t.title} className="topic-card">
                {t.icon} {t.title}
              </div>
            ))}
          </div>

          <form className="create-post" onSubmit={handlePost}>
            <textarea
              placeholder="Write something..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />

            <input type="file" accept="image/*" onChange={handleImageChange} />

            {imagePreview && (
              <img className="post-image" src={imagePreview} alt="preview" />
            )}

            <button type="submit">Post</button>
          </form>

          {loading ? (
            <p>Loading...</p>
          ) : (
            filtered.map((post) => (
              <div key={post.id} className="post">
                <div className="post-header">
                  <h3>{post.name}</h3>

                  {post.user_id === user.id && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p>{post.content}</p>

                {post.image && (
                  <img
                    className="post-image"
                    src={`${API_BASE}${post.image}`}
                    alt="post"
                  />
                )}

                <button onClick={() => handleLike(post.id)}>
                  ❤️ {post.likes_count || 0}
                </button>

                {(post.comments || []).map((c) => (
                  <div key={c.id} className="comment-row">
                    <span>
                      <b>{c.name}</b>: {c.content}
                    </span>

                    {c.user_id === user.id && (
                      <button
                        className="delete-comment-btn"
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}

                <div className="comment-form">
                  <input
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs({
                        ...commentInputs,
                        [post.id]: e.target.value,
                      })
                    }
                    placeholder="Comment..."
                  />

                  <button onClick={() => handleComment(post.id)}>Send</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;