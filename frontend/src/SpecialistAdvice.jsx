import { useState } from "react";
import axios from "axios";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import Rightbar from "./components/Rightbar";
import "./App.css";

const API_BASE = "https://circle-of-hope-backend.onrender.com";

const quickExamples = [
  "My child gets upset from loud sounds",
  "How can I help my child communicate better?",
  "My child has meltdowns when the routine changes",
  "How can I support my child at school?",
];

function SpecialistAdvice() {
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      alert("Please write your question first");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE}/specialist-advice`, {
        question,
      });

      setAdvice(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to get advice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar />

      <div className="main-layout">
        <Sidebar />

        <div className="feed">
          <section className="specialist-hero">
            <div>
              <span className="specialist-pill">🧠 Guide-Based Support</span>

              <h1>Specialist Advice</h1>

              <p>
                Ask a question about autism support. The system searches the
                Autism Guide first, then gives general support if no guide topic
                is found.
              </p>
            </div>

            <div className="specialist-ai-box">
              <strong>AI</strong>
              <span>Support</span>
              <small>Autism Guide Search</small>
            </div>
          </section>

          <section className="specialist-steps">
            <div className="specialist-step-card">
              <span>1</span>
              <h3>Write a Question</h3>
              <p>
                Ask about behavior, school, routines, communication, or sensory
                issues.
              </p>
            </div>

            <div className="specialist-step-card">
              <span>2</span>
              <h3>Search the Guide</h3>
              <p>
                The system checks the Autism Guide stored in the database.
              </p>
            </div>

            <div className="specialist-step-card">
              <span>3</span>
              <h3>Receive Advice</h3>
              <p>
                You get a clear supportive answer with a safety reminder.
              </p>
            </div>
          </section>

          <section className="specialist-card">
            <div className="specialist-card-header">
              <div>
                <h2>Ask for Autism Support Guidance</h2>
                <p>
                  This assistant helps users receive quick educational guidance
                  connected to the project’s Autism Guide.
                </p>
              </div>
            </div>

            <form onSubmit={handleGetAdvice}>
              <label>Your Question</label>

              <textarea
                placeholder="Example: My child becomes overwhelmed in noisy places. What can I do?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              <div className="specialist-form-footer">
                <small>
                  The response is educational and does not replace a licensed
                  specialist.
                </small>

                <button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Get Advice"}
                </button>
              </div>
            </form>

            <div className="specialist-examples">
              <h3>Quick examples</h3>

              <div>
                {quickExamples.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuestion(item);
                      setAdvice(null);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {advice && (
              <div className="specialist-result">
                <div className="specialist-result-top">
                  <span
                    className={
                      advice.source === "Autism Guide"
                        ? "specialist-source guide"
                        : "specialist-source general"
                    }
                  >
                    {advice.source === "Autism Guide"
                      ? "From Autism Guide"
                      : "General Advice"}
                  </span>

                  {advice.category && (
                    <span className="specialist-category">
                      {advice.category}
                    </span>
                  )}
                </div>

                <h3>{advice.title}</h3>

                <p>{advice.answer}</p>

                <div className="specialist-warning">
                  ⚠️ This advice is for awareness and general support only. For
                  serious cases, users should contact a qualified specialist.
                </div>
              </div>
            )}
          </section>
        </div>

        <Rightbar />
      </div>
    </>
  );
}

export default SpecialistAdvice;