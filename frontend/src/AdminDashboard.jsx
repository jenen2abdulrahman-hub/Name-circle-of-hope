import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

const API_BASE = "https://circle-of-hope-backend.onrender.com";

function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    loadAll();
  }, [navigate]);

  const loadAll = async () => {
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchPosts(),
      fetchComments(),
      fetchResources(),
    ]);
  };

  const fetchStats = async () => {
    const res = await axios.get(`${API_BASE}/admin/stats/${user.id}`);
    setStats(res.data);
  };

  const fetchUsers = async () => {
    const res = await axios.get(`${API_BASE}/admin/users/${user.id}`);
    setUsers(res.data);
  };

  const fetchPosts = async () => {
    const res = await axios.get(`${API_BASE}/admin/posts/${user.id}`);
    setPosts(res.data);
  };

  const fetchComments = async () => {
    const res = await axios.get(`${API_BASE}/admin/comments/${user.id}`);
    setComments(res.data);
  };

  const fetchResources = async () => {
    const res = await axios.get(`${API_BASE}/admin/resources/${user.id}`);
    setResources(res.data);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleUpdateUser = async (id, role, is_verified) => {
    await axios.put(`${API_BASE}/admin/users/${id}`, {
      adminId: user.id,
      role,
      is_verified,
    });

    setMessage("User updated successfully");
    fetchUsers();
    fetchStats();
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user and all related data?")) return;

    await axios.delete(`${API_BASE}/admin/users/${id}`, {
      data: { adminId: user.id },
    });

    setMessage("User deleted successfully");
    fetchUsers();
    fetchStats();
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Delete this post?")) return;

    await axios.delete(`${API_BASE}/admin/posts/${id}`, {
      data: { adminId: user.id },
    });

    setMessage("Post deleted successfully");
    fetchPosts();
    fetchStats();
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Delete this comment?")) return;

    await axios.delete(`${API_BASE}/admin/comments/${id}`, {
      data: { adminId: user.id },
    });

    setMessage("Comment deleted successfully");
    fetchComments();
    fetchStats();
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Delete this resource?")) return;

    await axios.delete(`${API_BASE}/admin/resources/${id}`, {
      data: { adminId: user.id },
    });

    setMessage("Resource deleted successfully");
    fetchResources();
    fetchStats();
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      `${u.name} ${u.email} ${u.role} ${u.specialty || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [users, search]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) =>
      `${p.name} ${p.role} ${p.content || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [posts, search]);

  const filteredComments = useMemo(() => {
    return comments.filter((c) =>
      `${c.name} ${c.role} ${c.content || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [comments, search]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) =>
      `${r.title} ${r.category} ${r.description || ""} ${r.location || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [resources, search]);
  const pendingSpecialists = users.filter(
  (u) => u.role === "specialist" && !u.is_verified
).length;
  return (
    <div className="admin-page">
      <header className="admin-hero">
        <div>
          <span className="brand-chip light">Circle of Hope</span>
          <h1>Admin Control Center</h1>
          <p>
            Manage users, verify specialists, moderate posts, comments, and
            support directory resources.
          </p>
        </div>

        <div className="admin-actions">
          <Link className="secondary-btn link-btn" to="/dashboard">
            Dashboard
          </Link>
          <Link className="secondary-btn link-btn" to="/resources">
            Resources
          </Link>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="admin-stats">
        <div className="admin-stat-card">
          <span>Total Users</span>
          <strong>{stats.totalUsers || 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Parents</span>
          <strong>{stats.totalParents || 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Specialists</span>
          <strong>{stats.totalSpecialists || 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Posts</span>
          <strong>{stats.totalPosts || 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Resources</span>
          <strong>{stats.totalResources || 0}</strong>
        </div>
      </section>

      {message && <div className="inline-message">{message}</div>}
      {pendingSpecialists > 0 && (
  <div className="inline-message">
    🔔 {pendingSpecialists} specialist registration(s) waiting for verification.
  </div>
)}

      <section className="admin-tools">
        <div className="admin-tabs">
          <button
            className={activeTab === "users" ? "active-admin-tab" : ""}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>

          <button
            className={activeTab === "posts" ? "active-admin-tab" : ""}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>

          <button
            className={activeTab === "comments" ? "active-admin-tab" : ""}
            onClick={() => setActiveTab("comments")}
          >
            Comments
          </button>

          <button
            className={activeTab === "resources" ? "active-admin-tab" : ""}
            onClick={() => setActiveTab("resources")}
          >
            Resources
          </button>
        </div>

        <input
          className="admin-search"
          placeholder="Search by name, email, role, content, resource..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="secondary-btn" onClick={loadAll}>
          Refresh
        </button>
      </section>

      {activeTab === "users" && (
        <section className="admin-section">
          <h2>Manage Users</h2>

          <div className="admin-list">
            {filteredUsers.map((u) => (
              <div className="admin-user-card" key={u.id}>
                <div className="admin-user-left">
                  <img
                    src={
                      u.profile_pic
                        ? `${API_BASE}${u.profile_pic}`
                        : "https://via.placeholder.com/55"
                    }
                    alt="user"
                    className="user-avatar"
                  />

                  <div>
                    <h3>{u.name}</h3>
                    <p>{u.email}</p>

                    <span className="role-pill">{u.role}</span>
                      {u.role === "specialist" && u.verification_file && (
  <a
    className="secondary-btn link-btn"
    href={`${API_BASE}${u.verification_file}`}
    target="_blank"
    rel="noreferrer"
  >
    View File
  </a>
)}
                    {u.role === "specialist" && (
                      <span
                        className={
                          u.is_verified
                            ? "verify-badge verify-green"
                            : "verify-badge verify-orange"
                        }
                      >
                        {u.is_verified ? "Verified" : "Pending"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="admin-card-actions">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      handleUpdateUser(u.id, e.target.value, false)
                    }
                  >
                    <option value="parent">parent</option>
                    <option value="specialist">specialist</option>
                    <option value="admin">admin</option>
                  </select>

                  {u.role === "specialist" && (
                    <button
                      className={u.is_verified ? "secondary-btn" : "login-btn"}
                      onClick={() =>
                        handleUpdateUser(u.id, "specialist", !u.is_verified)
                      }
                    >
                      {u.is_verified ? "Unverify" : "Verify"}
                    </button>
                  )}

                  <button
                    className="danger-btn"
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "posts" && (
        <section className="admin-section">
          <h2>Moderate Posts</h2>

          <div className="admin-list">
            {filteredPosts.map((p) => (
              <div className="admin-post-card" key={p.id}>
                <div className="post-header">
                  <div>
                    <h3>{p.name}</h3>
                    <span className="role-pill">{p.role}</span>
                  </div>

                  <button
                    className="danger-btn"
                    onClick={() => handleDeletePost(p.id)}
                  >
                    Delete Post
                  </button>
                </div>

                <p>{p.content}</p>

                {p.image && (
                  <img
                    className="admin-post-image"
                    src={`${API_BASE}${p.image}`}
                    alt="post"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "comments" && (
        <section className="admin-section">
          <h2>Moderate Comments</h2>

          <div className="admin-list">
            {filteredComments.map((c) => (
              <div className="admin-comment-card" key={c.id}>
                <div>
                  <h3>{c.name}</h3>
                  <span className="role-pill">{c.role}</span>
                  <p>{c.content}</p>
                </div>

                <button
                  className="danger-btn"
                  onClick={() => handleDeleteComment(c.id)}
                >
                  Delete Comment
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "resources" && (
        <section className="admin-section">
          <h2>Manage Resources</h2>

          <div className="admin-list">
            {filteredResources.map((r) => (
              <div className="admin-post-card" key={r.id}>
                <div className="post-header">
                  <div>
                    <h3>{r.title}</h3>
                    <span className="role-pill">{r.category}</span>
                  </div>

                  <button
                    className="danger-btn"
                    onClick={() => handleDeleteResource(r.id)}
                  >
                    Delete Resource
                  </button>
                </div>

                {r.creator_name && (
                  <p>
                    <strong>Added by:</strong> {r.creator_name} ({r.creator_role})
                  </p>
                )}

                {r.description && <p>{r.description}</p>}
                {r.contact_info && (
                  <p>
                    <strong>Contact:</strong> {r.contact_info}
                  </p>
                )}
                {r.location && (
                  <p>
                    <strong>Location:</strong> {r.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminDashboard;