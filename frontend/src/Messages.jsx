import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "./Layout";
import "./App.css";

const API_BASE = "http://localhost:5000";

function Messages() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchChatUsers();
    }
  }, []);

  useEffect(() => {
    let interval;

    if (conversation?.id) {
      fetchMessages(conversation.id);

      interval = setInterval(() => {
        fetchMessages(conversation.id);
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [conversation]);

  const fetchChatUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/chat-users/${user.id}`);
      setChatUsers(res.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const openChat = async (otherUser) => {
    try {
      setSelectedUser(otherUser);

      const res = await axios.post(`${API_BASE}/conversations`, {
        user1_id: user.id,
        user2_id: otherUser.id,
      });

      setConversation(res.data);
      fetchMessages(res.data.id);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const res = await axios.get(`${API_BASE}/messages/${conversationId}`);
      setMessages(res.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() || !conversation || !selectedUser) return;

    try {
      await axios.post(`${API_BASE}/messages`, {
        conversation_id: conversation.id,
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message: text,
      });

      setText("");
      fetchMessages(conversation.id);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  return (
    <Layout>
      <div className="messages-page">
        <div className="messages-header">
          <div>
            <span className="brand-chip light">Circle of Hope</span>
            <h1>Messages</h1>
            <p>Chat privately with users who follow you back.</p>
          </div>
        </div>

        <div className="messages-layout">
          <aside className="chat-users-panel">
            <h2>Followers Chat</h2>

            {chatUsers.length === 0 ? (
              <p className="empty-chat">
                No mutual followers yet. Follow users and wait for them to
                follow you back to start chatting.
              </p>
            ) : (
              chatUsers.map((u) => (
                <button
                  key={u.id}
                  className={`chat-user-card ${
                    selectedUser?.id === u.id ? "active-chat-user" : ""
                  }`}
                  onClick={() => openChat(u)}
                >
                  <img
                    src={
                      u.profile_pic
                        ? `${API_BASE}${u.profile_pic}`
                        : "https://via.placeholder.com/45"
                    }
                    alt="user"
                  />

                  <div>
                    <strong>{u.name}</strong>
                    <span>{u.role}</span>
                  </div>
                </button>
              ))
            )}
          </aside>

          <section className="chat-box">
            {!selectedUser ? (
              <div className="no-chat-selected">
                <div className="chat-big-icon">💬</div>
                <h2>Select a user to start chatting</h2>
                <p>
                  Private messages are available only between mutual followers.
                </p>
              </div>
            ) : (
              <>
                <div className="chat-box-header">
                  <img
                    src={
                      selectedUser.profile_pic
                        ? `${API_BASE}${selectedUser.profile_pic}`
                        : "https://via.placeholder.com/45"
                    }
                    alt="user"
                  />

                  <div>
                    <h3>{selectedUser.name}</h3>
                    <span>{selectedUser.role}</span>
                  </div>
                </div>

                <div className="messages-list">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`message-bubble ${
                        m.sender_id === user.id ? "my-message" : "their-message"
                      }`}
                    >
                      <p>{m.message}</p>
                      <small>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  ))}
                </div>

                <form className="message-form" onSubmit={sendMessage}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a message..."
                  />

                  <button type="submit">Send</button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default Messages;