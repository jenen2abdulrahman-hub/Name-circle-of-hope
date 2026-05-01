import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import "./App.css";

const API_BASE = "https://circle-of-hope-backend.onrender.com";

function ProfilePage() {
  const { id } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/profile/${id}`);
      setProfile(res.data);
    } catch (error) {
      console.error("Profile error:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/user-posts/${id}`);
      setPosts(res.data);
    } catch (error) {
      console.error("User posts error:", error);
    }
  };

  const fetchFollowState = async () => {
    try {
      if (!currentUser?.id) return;

      const res = await axios.get(`${API_BASE}/users/${currentUser.id}`);
      const foundUser = res.data.find((u) => String(u.id) === String(id));
      setIsFollowing(foundUser ? foundUser.is_following === 1 : false);
    } catch (error) {
      console.error("Follow state error:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchFollowState();
  }, [id]);

  const handleFollow = async () => {
    try {
      await axios.post(`${API_BASE}/follow`, {
        follower_id: currentUser.id,
        following_id: Number(id),
      });
      setIsFollowing(true);
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.post(`${API_BASE}/unfollow`, {
        follower_id: currentUser.id,
        following_id: Number(id),
      });
      setIsFollowing(false);
    } catch (error) {
      console.error("Unfollow error:", error);
    }
  };

  if (!profile) return <div style={{ padding: "20px" }}>Loading...</div>;

  const isMyProfile = currentUser && String(currentUser.id) === String(id);

  return (
    <div className="page-container">
    <div className="dashboard-page">
      <div className="page-topbar">
        <div>
          <div className="brand-chip light">Circle of Hope</div>
          <h1>User Profile</h1>
        </div>

        <div className="topbar-links">
          <Link className="secondary-btn link-btn" to="/dashboard">
            Dashboard
          </Link>
          <Link className="secondary-btn link-btn" to="/users">
            Users
          </Link>
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar-box">
            <img
              src={
                profile.profile_pic
                  ? `${API_BASE}${profile.profile_pic}?t=${Date.now()}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profile.name
                    )}&background=2d6cdf&color=fff`
              }
              alt={profile.name}
              className="profile-avatar"
            />
          </div>

          <div className="profile-summary">
            <h2>
  {profile.name}{" "}
  {profile.role === "specialist" && Number(profile.is_verified) === 1 && (
    <span className="verified-badge">Verified Specialist</span>
  )}
</h2>

            <p>
              <strong>Role:</strong> {profile.role}
            </p>

            {profile.specialty && (
              <p>
                <strong>Specialty:</strong> {profile.specialty}
              </p>
            )}

            {!isMyProfile && (
              <button
                className="secondary-btn"
                onClick={isFollowing ? handleUnfollow : handleFollow}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3>Posts</h3>

            {posts.length === 0 ? (
              <p>No posts yet.</p>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <p style={{ marginBottom: "8px" }}>{post.content}</p>
                  <small>{new Date(post.created_at).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ProfilePage;