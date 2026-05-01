import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Layout from "./Layout";
import "./App.css";

const API_BASE = "http://localhost:5000";

function Notifications() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      markAsRead();
    }
  }, []);

  const fetchNotifications = async () => {
    const res = await axios.get(`${API_BASE}/notifications/${user.id}`);
    setNotifications(res.data);
  };

  const markAsRead = async () => {
    await axios.put(`${API_BASE}/notifications/read/${user.id}`);
  };

  const deleteNotification = async (id) => {
    await axios.delete(`${API_BASE}/notifications/${id}`);
    fetchNotifications();
  };

  return (
    <Layout>
      <div className="notifications-page">
        <section className="notifications-hero">
          <div>
            <span className="brand-chip light">Circle of Hope</span>
            <h1>Notifications</h1>
            <p>Stay updated with follows, comments, likes, and community activity.</p>
          </div>

          <div className="notifications-icon">🔔</div>
        </section>

        <section className="notifications-list">
          {notifications.length === 0 ? (
            <div className="empty-state">No notifications yet.</div>
          ) : (
            notifications.map((n) => (
              <article
                key={n.id}
                className={`notification-card ${!n.is_read ? "unread-notification" : ""}`}
              >
                <img
                  src={
                    n.actor_pic
                      ? `${API_BASE}${n.actor_pic}`
                      : "https://via.placeholder.com/48"
                  }
                  alt="actor"
                />

                <div className="notification-content">
                  <p>
                    <strong>{n.actor_name || "Someone"}</strong> {n.message}
                  </p>

                  <span>{new Date(n.created_at).toLocaleString()}</span>

                  {n.link && (
                    <Link to={n.link} className="notification-link">
                      Open
                    </Link>
                  )}
                </div>

                <button
                  className="danger-btn"
                  onClick={() => deleteNotification(n.id)}
                >
                  Delete
                </button>
              </article>
            ))
          )}
        </section>
      </div>
    </Layout>
  );
}

export default Notifications;