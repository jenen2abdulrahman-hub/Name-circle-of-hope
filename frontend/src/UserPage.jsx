import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Layout from "./Layout";
import "./App.css";

const API_BASE = "http://localhost:5000";

function UsersPage() {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/users/${currentUser.id}`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (followingId) => {
    await axios.post(`${API_BASE}/follow`, {
      follower_id: currentUser.id,
      following_id: followingId,
    });

    fetchUsers();
  };

  const handleUnfollow = async (followingId) => {
    await axios.post(`${API_BASE}/unfollow`, {
      follower_id: currentUser.id,
      following_id: followingId,
    });

    fetchUsers();
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = `${user.name} ${user.role} ${user.specialty || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const totalSpecialists = users.filter((u) => u.role === "specialist").length;
  const totalParents = users.filter((u) => u.role === "parent").length;
  const followingCount = users.filter((u) => u.is_following).length;

  return (
    <Layout>
      <div className="users-page">
        <section className="users-hero">
          <div>
            <span className="brand-chip light">Circle of Hope Network</span>
            <h1>Community Members</h1>
            <p>
              Discover parents, specialists, and community members. Follow users
              to see their posts and build your support network.
            </p>
          </div>

          <div className="users-hero-card">
            <div className="hero-icon-big">👥</div>
            <h3>Connect with support</h3>
            <p>Follow people to personalize your home feed.</p>
          </div>
        </section>

        <section className="users-stats">
          <div>
            <span>Total Users</span>
            <strong>{users.length}</strong>
          </div>

          <div>
            <span>Parents</span>
            <strong>{totalParents}</strong>
          </div>

          <div>
            <span>Specialists</span>
            <strong>{totalSpecialists}</strong>
          </div>

          <div>
            <span>Following</span>
            <strong>{followingCount}</strong>
          </div>
        </section>

        <section className="users-tools">
          <input
            type="text"
            placeholder="Search by name, role, specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All roles</option>
            <option value="parent">Parents</option>
            <option value="specialist">Specialists</option>
            <option value="admin">Admins</option>
          </select>

          <button className="secondary-btn" onClick={fetchUsers}>
            Refresh
          </button>
        </section>

        {loading ? (
          <div className="empty-state">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">No users found.</div>
        ) : (
          <section className="users-grid">
            {filteredUsers.map((user) => (
              <article className="modern-user-card" key={user.id}>
                <div className="user-card-top">
                  <div className="avatar-wrapper big-avatar-wrapper">
                    <img
                      src={
                        user.profile_pic
                          ? `${API_BASE}${user.profile_pic}?t=${Date.now()}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name
                            )}&background=2d6cdf&color=fff`
                      }
                      alt={user.name}
                      className="modern-user-avatar"
                    />

                    <button
                      className={`follow-icon-btn ${
                        user.is_following ? "following" : ""
                      }`}
                      onClick={() =>
                        user.is_following
                          ? handleUnfollow(user.id)
                          : handleFollow(user.id)
                      }
                    >
                      {user.is_following ? "✓" : "+"}
                    </button>
                  </div>

                  <span className={`role-badge role-${user.role}`}>
                    {user.role}
                  </span>
                </div>

                <h3>
                  <Link to={`/profile/${user.id}`}>{user.name}</Link>
                </h3>

                {user.specialty && (
                  <p className="user-specialty">{user.specialty}</p>
                )}

                {user.role === "specialist" && (
                  <div
                    className={
                      user.is_verified
                        ? "verify-badge verify-green"
                        : "verify-badge verify-orange"
                    }
                  >
                    {user.is_verified ? "Verified Specialist" : "Pending"}
                  </div>
                )}

                <div className="user-card-actions">
                  <Link className="secondary-btn link-btn" to={`/profile/${user.id}`}>
                    View Profile
                  </Link>

                  <button
                    className={user.is_following ? "danger-btn" : "login-btn"}
                    onClick={() =>
                      user.is_following
                        ? handleUnfollow(user.id)
                        : handleFollow(user.id)
                    }
                  >
                    {user.is_following ? "Unfollow" : "Follow"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </Layout>
  );
}

export default UsersPage;