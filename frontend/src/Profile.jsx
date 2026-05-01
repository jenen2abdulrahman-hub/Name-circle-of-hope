import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import "./App.css";

const API_BASE = "http://localhost:5000";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    specialty: "",
    location: "",
  });

  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
  });

  const [listType, setListType] = useState(null);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser) {
      navigate("/");
      return;
    }

    setUser(savedUser);
    setForm({
      name: savedUser.name || "",
      bio: savedUser.bio || "",
      specialty: savedUser.specialty || "",
      location: savedUser.location || "",
    });
  }, [navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/follow-stats/${user.id}`);
      setStats(res.data);
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  const fetchList = async (type) => {
    try {
      const res = await axios.get(`${API_BASE}/${type}/${user.id}`);
      setUsersList(res.data);
      setListType(type);
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!image) {
      setMessage("Please choose an image first");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await axios.post(
        `${API_BASE}/upload-profile-pic/${user.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = res.data.user;

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setImage(null);
      setPreview("");
      setMessage("Profile picture updated successfully");
    } catch (error) {
      console.log("UPLOAD ERROR:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Upload failed");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.put(`${API_BASE}/profile/${user.id}`, form);

      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      setMessage("Profile updated successfully");
    } catch (error) {
      console.log(error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Failed to update profile");
    }
  };

  const completionItems = [
    user?.profile_pic,
    form.name,
    form.bio,
    form.location,
    user?.role === "specialist" ? form.specialty : true,
  ];

  const completion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100
  );

  if (!user) return null;

  return (
    <Layout>
      <div className="modern-profile-page">
        <section className="profile-hero-modern">
          <div className="profile-cover-content">
            <span className="brand-chip light">Circle of Hope Profile</span>
            <h1>My Profile</h1>
            <p>
              Manage your personal information, profile image, follow stats, and
              community identity.
            </p>

            <div className="profile-hero-actions">
              <Link className="secondary-btn link-btn" to="/dashboard">
                Dashboard
              </Link>

              <Link className="secondary-btn link-btn" to="/users">
                Find Users
              </Link>

              <Link className="secondary-btn link-btn" to="/resources">
                Resources
              </Link>
            </div>
          </div>

          <div className="profile-completion-card">
            <strong>{completion}%</strong>
            <span>Profile Complete</span>
            <div className="completion-bar">
              <div style={{ width: `${completion}%` }}></div>
            </div>
          </div>
        </section>

        {message && <div className="inline-message">{message}</div>}

        <section className="profile-main-grid">
          <aside className="profile-left-panel">
            <div className="profile-avatar-modern-box">
              <img
                src={
                  preview
                    ? preview
                    : user.profile_pic
                    ? `${API_BASE}${user.profile_pic}?t=${Date.now()}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name
                      )}&background=2d6cdf&color=fff`
                }
                alt="profile"
                className="profile-avatar-modern"
              />

              <label className="profile-upload-label">
                📷 Choose Photo
                <input type="file" accept="image/*" onChange={handleImageSelect} />
              </label>

              <button
                type="button"
                className="secondary-btn"
                onClick={handleImageUpload}
              >
                Upload Photo
              </button>
            </div>

            <div className="profile-name-box">
              <h2>{user.name}</h2>

              <span className={`role-badge role-${user.role}`}>
                {user.role}
              </span>

              {user.role === "specialist" && user.is_verified && (
                <span className="verify-badge verify-green">
                  Verified Specialist
                </span>
              )}

              {user.role === "specialist" && !user.is_verified && (
                <span className="verify-badge verify-orange">
                  Pending Verification
                </span>
              )}

              <p>{form.bio || "No bio added yet."}</p>
            </div>

            <div className="profile-stats-modern">
              <button onClick={() => fetchList("followers")}>
                <strong>{stats.followers}</strong>
                <span>Followers</span>
              </button>

              <button onClick={() => fetchList("following")}>
                <strong>{stats.following}</strong>
                <span>Following</span>
              </button>
            </div>

            <div className="profile-info-list">
              <div>
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{user.location || "Not added"}</strong>
              </div>

              {user.role === "specialist" && (
                <div>
                  <span>Specialty</span>
                  <strong>{user.specialty || "Not added"}</strong>
                </div>
              )}
            </div>
          </aside>

          <main className="profile-right-panel">
            <div className="profile-edit-card">
              <h2>Edit Profile</h2>
              <p>Keep your information updated so others can know you better.</p>

              <form onSubmit={handleSave} className="profile-form-modern">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                <label>Bio</label>
                <textarea
                  name="bio"
                  rows="5"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Write something about yourself..."
                />

                {user.role === "specialist" && (
                  <>
                    <label>Specialty</label>
                    <input
                      type="text"
                      name="specialty"
                      value={form.specialty}
                      onChange={handleChange}
                      placeholder="Example: Speech Therapist"
                    />
                  </>
                )}

                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Location, e.g. Beirut"
                  value={form.location}
                  onChange={handleChange}
                />

                <button className="login-btn" type="submit">
                  Save Changes
                </button>
              </form>
            </div>

            {listType && (
              <div className="followers-modal-card">
                <div className="followers-header">
                  <h2>{listType === "followers" ? "Followers" : "Following"}</h2>

                  <button
                    className="secondary-btn"
                    onClick={() => setListType(null)}
                  >
                    Close
                  </button>
                </div>

                {usersList.length === 0 ? (
                  <div className="empty-state">No users found.</div>
                ) : (
                  <div className="followers-list-modern">
                    {usersList.map((u) => (
                      <Link
                        key={u.id}
                        to={`/profile/${u.id}`}
                        className="follower-row-modern"
                      >
                        <img
                          src={
                            u.profile_pic
                              ? `${API_BASE}${u.profile_pic}`
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  u.name
                                )}&background=2d6cdf&color=fff`
                          }
                          alt={u.name}
                        />

                        <strong>{u.name}</strong>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </section>
      </div>
    </Layout>
  );
}

export default Profile;