import React, { useState } from "react";
import Layout from "./Layout";
import "./App.css";

const categories = [
  {
    id: "behavior",
    icon: "🧠",
    title: "Behavior",
    tips: [
      "Use short and clear instructions.",
      "Praise good behavior immediately.",
      "Prepare the child before changing activities.",
      "Use visual reminders instead of repeating many words.",
    ],
  },
  {
    id: "speech",
    icon: "💬",
    title: "Speech",
    tips: [
      "Give the child time to answer.",
      "Use pictures or gestures if speaking is hard.",
      "Repeat words calmly without pressure.",
      "Celebrate any communication attempt.",
    ],
  },
  {
    id: "sensory",
    icon: "🎧",
    title: "Sensory",
    tips: [
      "Reduce loud sounds and bright lights.",
      "Offer a quiet corner when overwhelmed.",
      "Notice textures, smells, or places that trigger stress.",
      "Use calming tools like headphones or soft toys.",
    ],
  },
  {
    id: "sleep",
    icon: "🌙",
    title: "Sleep",
    tips: [
      "Keep the same bedtime routine every night.",
      "Avoid screens before sleep.",
      "Use soft light and quiet sounds.",
      "Create a predictable sleep schedule.",
    ],
  },
  {
    id: "school",
    icon: "🏫",
    title: "School",
    tips: [
      "Use visual schedules in class.",
      "Give clear steps for tasks.",
      "Allow short sensory breaks.",
      "Communicate regularly with teachers.",
    ],
  },
];

function getAdvice(question) {
  const q = question.toLowerCase();

  const knowledgeBase = [
    {
      category: "Behavior",
      keywords: ["angry", "hit", "cry", "meltdown", "scream", "aggressive", "tantrum"],
      cause:
        "The child may be overwhelmed, frustrated, tired, or unable to express a need clearly.",
      steps: [
        "Stay calm and use a soft voice.",
        "Reduce noise, lights, or crowding around the child.",
        "Give the child space and time to calm down.",
        "Use simple words like: “safe”, “calm”, “help”.",
        "After calming down, help the child name the feeling using pictures or simple words.",
      ],
      warning:
        "If the child hurts themselves or others often, consult a licensed specialist.",
    },
    {
      category: "Speech",
      keywords: ["talk", "speak", "speech", "word", "communication", "language"],
      cause:
        "The child may need more time or a different way to communicate, such as gestures, pictures, or pointing.",
      steps: [
        "Do not force the child to speak.",
        "Give extra time to respond.",
        "Accept gestures, pointing, or sounds as communication.",
        "Use short repeated phrases.",
        "Praise every communication attempt.",
      ],
      warning:
        "If speech delay continues, a speech therapist can help with a structured plan.",
    },
    {
      category: "Sensory",
      keywords: ["noise", "sound", "light", "touch", "sensory", "crowd", "clothes", "food texture"],
      cause:
        "The child may be sensitive to sensory input such as loud sounds, bright lights, textures, smells, or crowded places.",
      steps: [
        "Move the child to a quieter place.",
        "Lower bright lights if possible.",
        "Offer headphones, a soft toy, or a calm object.",
        "Avoid forcing uncomfortable textures.",
        "Notice patterns and write down common triggers.",
      ],
      warning:
        "If sensory reactions strongly affect daily life, ask an occupational therapist for support.",
    },
    {
      category: "Sleep",
      keywords: ["sleep", "bed", "night", "wake", "tired", "insomnia"],
      cause:
        "The child may need a predictable bedtime routine and a calmer environment before sleep.",
      steps: [
        "Keep the same bedtime every night.",
        "Avoid screens before sleep.",
        "Use dim lights and quiet sounds.",
        "Create a visual bedtime routine.",
        "Repeat the same steps every night: wash, story, calm time, sleep.",
      ],
      warning:
        "If sleep problems are severe or long-term, discuss it with a doctor or specialist.",
    },
    {
      category: "School",
      keywords: ["school", "teacher", "class", "study", "homework", "learning"],
      cause:
        "The child may need clear structure, visual support, and breaks during learning tasks.",
      steps: [
        "Use visual schedules in class.",
        "Break tasks into small steps.",
        "Give short and clear instructions.",
        "Allow short sensory breaks.",
        "Communicate regularly with teachers.",
      ],
      warning:
        "If school difficulties continue, ask for an individualized support plan.",
    },
  ];

  const matches = knowledgeBase.filter((item) =>
    item.keywords.some((keyword) => q.includes(keyword))
  );

  const selected =
    matches.length > 0
      ? matches
      : [
          {
            category: "General Support",
            cause:
              "The child may be reacting to a trigger such as change in routine, sensory overload, hunger, tiredness, or communication difficulty.",
            steps: [
              "Observe what happened before the behavior.",
              "Use calm voice and simple words.",
              "Try visual support or a clear routine.",
              "Write down repeated triggers.",
              "Ask a specialist if the concern continues.",
            ],
            warning:
              "This advice is educational and does not replace professional diagnosis or treatment.",
          },
        ];

  const mainCategories = selected.map((m) => m.category).join(" + ");

  const combinedSteps = selected.flatMap((m) => m.steps).slice(0, 7);

  return {
    title: `AI-like Advice: ${mainCategories}`,
    answer: `
Possible reason:
${selected[0].cause}

What you can try:
${combinedSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

When to seek help:
${selected[0].warning}
    `,
  };
}

function SpecialistAdvice() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);

const handleAsk = (e) => {
  e.preventDefault();

  if (!question.trim()) return;

  const result = getAdvice(question);
  setAnswer(result);
};

  return (
    <Layout>
      <div className="advice-page">
        <section className="advice-hero">
          <div>
            <span className="brand-chip light">Circle of Hope</span>
            <h1>Specialist Advice Center</h1>
            <p>
              Structured autism guidance for parents, organized by behavior,
              speech, sensory needs, sleep, and school support.
            </p>
          </div>

          <div className="advice-hero-card">
            <div>🧑‍⚕️</div>
            <h3>Ask for guidance</h3>
            <p>Write a parent question and get safe educational advice.</p>
          </div>
        </section>

        <section className="advice-layout">
          <aside className="advice-categories">
            <h2>Categories</h2>

            {categories.map((cat) => (
              <button
                key={cat.id}
                className={activeCategory.id === cat.id ? "active-advice-cat" : ""}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{cat.icon}</span>
                {cat.title}
              </button>
            ))}
          </aside>

          <main className="advice-main">
            <section className="advice-card-large">
              <div className="advice-title-row">
                <div className="advice-big-icon">{activeCategory.icon}</div>
                <div>
                  <h2>{activeCategory.title} Support</h2>
                  <p>Helpful strategies parents can use at home or school.</p>
                </div>
              </div>

              <div className="tips-grid">
                {activeCategory.tips.map((tip, index) => (
                  <div key={tip} className="tip-card">
                    <span>{index + 1}</span>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="ask-specialist-box">
              <h2>Ask a Parent Question</h2>
              <p>
                Example: “My child cries when there is loud noise” or “My child
                does not want to sleep.”
              </p>

              <form onSubmit={handleAsk}>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Write your question here..."
                  rows={5}
                />

                <button className="login-btn" type="submit">
                  Get Advice
                </button>
              </form>

              {answer && (
                <div className="advice-answer">
                  <h3>{answer.title}</h3>
                  <p style={{ whiteSpace: "pre-line" }}>{answer.answer}</p>

                  <small>
                    This is educational support only and does not replace a
                    licensed specialist or medical diagnosis.
                  </small>
                </div>
              )}
            </section>
          </main>
        </section>
      </div>
    </Layout>
  );
}

export default SpecialistAdvice;