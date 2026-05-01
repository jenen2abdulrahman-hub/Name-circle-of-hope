import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "./Layout";
import "./App.css";
import Chatbot from "./Chatbot";

const API_BASE = "http://localhost:5000";

function Resources() {
  const [user, setUser] = useState(null);
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    category: "center",
    description: "",
    contact_info: "",
    location: "",
  });

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (savedUser) {
      setUser(savedUser);
      fetchResources();
    }
  }, []);

  const fetchResources = async () => {
    try {
      const res = await axios.get(`${API_BASE}/resources`);
      setResources(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log(error.response?.data || error.message);
      setMessage("Failed to load resources");
    }
  };
  const handleRate = async (resourceId, rating) => {
  try {
    await axios.post(`${API_BASE}/resources/${resourceId}/rate`, {
      userId: user.id,
      rating,
    });

    fetchResources();
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

  const handleAddResource = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_BASE}/resources`, {
  ...form,
  title:
    user.role === "specialist" && form.category === "doctor"
      ? user.name
      : form.title,
  created_by: user.id,
});

      setForm({
        title: "",
        category: "center",
        description: "",
        contact_info: "",
        location: "",
      });

      await fetchResources();
      setMessage("Specialist / center added successfully");
    } catch (error) {
      console.log(error.response?.data || error.message);
      setMessage("Failed to add specialist / center");
    }
  };

  const getCategoryIcon = (category) => {
    if (category === "doctor") return "🧑‍⚕️";
    if (category === "center") return "🏥";
    if (category === "therapy") return "🧩";
    if (category === "specialist") return "🧠";
    return "📄";
  };

  const filteredResources = resources.filter((item) => {
    const matchesSearch = `${item.title} ${item.description} ${item.location} ${item.contact_info}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter = filter === "all" || item.category === filter;

    return matchesSearch && matchesFilter;
  });

  return (
     <>
    <Layout>
      <div className="directory-page">
        <section className="directory-hero">
          <div>
            <span className="brand-chip light">Circle of Hope Care Network</span>
            <h1>🧑‍⚕️ Specialists & Centers</h1>
            <p>
              Find trusted doctors, autism specialists, therapy services, and
              support centers to help your child.
            </p>
          </div>

          <div className="directory-hero-card">
            <div>🧑‍⚕️</div>
            <h3>Trusted support</h3>
            <p>Keep useful specialists, centers, and contacts in one place.</p>
          </div>
        </section>

        <section className="directory-layout">
          <div className="directory-form-card">
            <h2>Add Specialist or Center</h2>
            <p>
              Add a doctor, therapist, specialist, or center that can help
              families in the autism community.
            </p>

            <form onSubmit={handleAddResource}>
              <input
                type="text"
                name="title"
                placeholder="Name / title"
                value={form.title}
                onChange={handleChange}
                required
              />

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="center">Center</option>
                <option value="doctor">Doctor</option>
                <option value="therapy">Therapy</option>
                <option value="specialist">Specialist</option>
                <option value="article">Article</option>
              </select>

              <textarea
                name="description"
                rows="5"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
              />

              <input
                type="text"
                name="contact_info"
                placeholder="Phone, email, website, or social media"
                value={form.contact_info}
                onChange={handleChange}
              />

              <input
                type="text"
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={handleChange}
              />

              <button className="login-btn" type="submit">
                Add
              </button>
            </form>

            {message && <div className="inline-message">{message}</div>}
          </div>

          <div className="directory-info-card">
            <h2>What you can add</h2>

            <div className="directory-info-item">
              <span>🏥</span>
              <p>Autism centers for diagnosis, therapy, and support.</p>
            </div>

            <div className="directory-info-item">
              <span>🧑‍⚕️</span>
              <p>Doctors, psychologists, speech therapists, and specialists.</p>
            </div>

            <div className="directory-info-item">
              <span>🧩</span>
              <p>Therapy services like speech, behavior, and occupational therapy.</p>
            </div>

            <div className="directory-info-item">
              <span>📍</span>
              <p>Locations and contact information parents can use quickly.</p>
            </div>
          </div>
        </section>

        <section className="directory-list-section">
          <div className="section-title-row">
            <div>
              <h2>Available Specialists & Centers</h2>
              <p className="section-subtitle">
                Browse doctors, therapy services, and autism support centers.
              </p>
            </div>

            <button className="secondary-btn" onClick={fetchResources}>
              Refresh
            </button>
          </div>

          <div className="directory-tools">
            <input
              type="text"
              placeholder="Search by name, location, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="center">Centers</option>
              <option value="doctor">Doctors</option>
              <option value="therapy">Therapy</option>
              <option value="specialist">Specialists</option>
              <option value="article">Articles</option>
            </select>
          </div>

          {filteredResources.length === 0 ? (
            <div className="empty-state">No specialists or centers found.</div>
          ) : (
            <div className="directory-grid">
              {filteredResources.map((resource) => (
                <article className="directory-card" key={resource.id}>
                  <div className="directory-card-top">
                    {resource.creator_name && (
  <p className="directory-added-by">
    Added by: <strong>{resource.creator_name}</strong> ({resource.creator_role})
  </p>
)}

<div className="rating-box">
  {[1, 2, 3, 4, 5].map((star) => (
    <button key={star} onClick={() => handleRate(resource.id, star)}>
      ⭐
    </button>
  ))}

  <span>
    {Number(resource.avg_rating).toFixed(1)} / 5 
    ({resource.rating_count} ratings)
  </span>
</div>
                    <h3>{resource.title}</h3>
                    <span>
                      {getCategoryIcon(resource.category)} {resource.category}
                    </span>
                  </div>

                  {resource.description && <p>{resource.description}</p>}

                  <div className="directory-meta">
                    {resource.contact_info && (
                      <small>☎ Contact: {resource.contact_info}</small>
                    )}

                    {resource.location && (
                      <small>📍 Location: {resource.location}</small>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
    <Chatbot />
     </>
    
  );
}

export default Resources;