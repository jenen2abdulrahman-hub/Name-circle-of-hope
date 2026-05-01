import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = message;
    setChat((prev) => [...prev, { type: "user", text: userMsg }]);
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/chatbot`, {
        message: userMsg,
      });

      const data = res.data.reply;

      if (Array.isArray(data)) {
        setChat((prev) => [
          ...prev,
          {
            type: "bot",
            text: data.map((r) => ({
              title: r.title,
              description: r.description,
            })),
          },
        ]);
      } else {
        setChat((prev) => [...prev, { type: "bot", text: data }]);
      }
    } catch (err) {
      console.log(err);
      setChat((prev) => [...prev, { type: "bot", text: "Error" }]);
    }
  };

  return (
    <>
      {/* 💬 Small Icon */}
      <button className="chat-icon" onClick={() => setOpen(!open)}>
        💬
      </button>

      {/* Chat appears only when open */}
      {open && (
        <div className="chatbox">
          <div className="chat-header">
            <span>Assistant</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-body">
            {chat.map((msg, i) => (
              <div key={i} className={msg.type === "user" ? "msg user" : "msg bot"}>
                {Array.isArray(msg.text)
                  ? msg.text.map((item, index) => (
                      <div key={index}>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>
                    ))
                  : msg.text}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Search..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;