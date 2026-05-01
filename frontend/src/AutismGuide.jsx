import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import Layout from "./Layout";
const guideCards = [
  {
    icon: "🧩",
    title: "What is Autism?",
    text:
      "Autism Spectrum Disorder is a developmental condition that can affect communication, social interaction, behavior, interests, and sensory processing. Every autistic person is different, so support should be personalized.",
    source: "CDC - Autism Spectrum Disorder",
    link: "https://www.cdc.gov/autism/",
    tag: "Awareness",
  },
  {
    icon: "💬",
    title: "Communication Support",
    text:
      "Some autistic children may speak, some may use gestures, pictures, assistive technology, or other communication methods. Families should encourage communication in the way that works best for the child.",
    source: "NHS - Autism Support",
    link: "https://www.nhs.uk/conditions/autism/",
    tag: "Communication",
  },
  {
    icon: "👂",
    title: "Sensory Sensitivities",
    text:
      "Autistic people may be sensitive to sound, light, textures, smells, or crowded places. Creating a calm environment and reducing overwhelming stimuli can help them feel safer.",
    source: "World Health Organization - Autism",
    link: "https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders",
    tag: "Sensory",
  },
  {
    icon: "📅",
    title: "Daily Routine",
    text:
      "Predictable routines can reduce anxiety. Visual schedules, simple instructions, and preparation before changes can make daily activities easier.",
    source: "CDC - Treatment and Intervention",
    link: "https://www.cdc.gov/autism/treatment/",
    tag: "Daily Life",
  },
  {
    icon: "🏫",
    title: "School Support",
    text:
      "Children with autism may need educational support such as individualized learning plans, speech therapy, occupational therapy, or classroom adjustments.",
    source: "American Academy of Pediatrics",
    link: "https://www.aap.org/",
    tag: "Education",
  },
  {
    icon: "❤️",
    title: "Family Support",
    text:
      "Parents and caregivers need emotional support too. Joining support groups, speaking with specialists, and learning reliable information can help families feel less alone.",
    source: "Autism Speaks - Family Services",
    link: "https://www.autismspeaks.org/family-services",
    tag: "Family",
  },
];

const quickTips = [
  "Use clear and simple language.",
  "Give the child enough time to respond.",
  "Avoid sudden changes when possible.",
  "Use visual supports such as pictures or schedules.",
  "Respect sensory needs and personal space.",
  "Celebrate small progress.",
];

function AutismGuide() {
  const [search, setSearch] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
const isAdmin = user?.role === "admin";

const [adminGuides, setAdminGuides] = useState([]);
const [newGuide, setNewGuide] = useState({
  icon: "🧩",
  title: "",
  text: "",
  tag: "",
  source: "",
  link: "",

});
const handleDeleteGuide = (indexToDelete) => {
  const updatedGuides = adminGuides.filter((_, index) => index !== indexToDelete);

  setAdminGuides(updatedGuides);
  localStorage.setItem("adminAutismGuides", JSON.stringify(updatedGuides));
};

useEffect(() => {
  const savedGuides = JSON.parse(localStorage.getItem("adminAutismGuides")) || [];
  setAdminGuides(savedGuides);
}, []);

const handleAddGuide = (e) => {
  e.preventDefault();

  if (!newGuide.title || !newGuide.text || !newGuide.tag) {
    alert("Please fill title, text, and tag");
    return;
  }

  const updatedGuides = [newGuide, ...adminGuides];
  setAdminGuides(updatedGuides);
  localStorage.setItem("adminAutismGuides", JSON.stringify(updatedGuides));

  setNewGuide({
    icon: "🧩",
    title: "",
    text: "",
    tag: "",
    source: "",
    link: "",
  });
};
   const allGuideCards = [...adminGuides, ...guideCards];

const filteredCards = allGuideCards.filter((item) => 
    `${item.title} ${item.text} ${item.tag}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="autism-page">
      <header className="autism-hero">
        <div>
          <span className="brand-chip light">Circle of Hope Knowledge Center</span>
          <h1>Autism Support & Advice Guide</h1>
          <p>
            A professional, trusted, and family-friendly guide that helps parents,
            caregivers, and specialists understand autism and support children in
            daily life.
          </p>

          <div className="autism-hero-actions">
            <Link to="/dashboard" className="secondary-btn link-btn">
              Back to Dashboard
            </Link>

            <a
              href="https://www.cdc.gov/autism/"
              target="_blank"
              rel="noreferrer"
              className="login-btn source-main-btn"
            >
              Main Source: CDC
            </a>
          </div>
        </div>

        <div className="autism-hero-card">
          <div className="hero-icon-big">🧩</div>
          <h3>Autism is a spectrum</h3>
          <p>
            Every child has different strengths, needs, communication styles,
            and sensory experiences.
          </p>
        </div>
      </header>

      <section className="autism-search-box">
        <div>
          <h2>Explore Topics</h2>
          <p>Search advice by communication, routine, sensory needs, school, or family support.</p>
        </div>

        <input
          type="text"
          placeholder="Search autism advice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <section className="autism-feature-grid">
        <div className="autism-feature-card">
          <strong>For Parents</strong>
          <p>Understand behaviors, routines, communication, and home support.</p>
        </div>

        <div className="autism-feature-card">
          <strong>For Specialists</strong>
          <p>Share professional guidance and educational strategies.</p>
        </div>

        <div className="autism-feature-card">
          <strong>For Community</strong>
          <p>Build awareness, acceptance, and respectful inclusion.</p>
        </div>
      </section>
          {isAdmin && (
  <section className="guide-form">
    <h2>Add New Autism Guide</h2>

    <form onSubmit={handleAddGuide}>
      <input
        type="text"
        placeholder="Icon example: 🧩"
        value={newGuide.icon}
        onChange={(e) =>
          setNewGuide({ ...newGuide, icon: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Guide title"
        value={newGuide.title}
        onChange={(e) =>
          setNewGuide({ ...newGuide, title: e.target.value })
        }
      />

      <textarea
        placeholder="Guide advice / content"
        value={newGuide.text}
        onChange={(e) =>
          setNewGuide({ ...newGuide, text: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Tag example: Communication"
        value={newGuide.tag}
        onChange={(e) =>
          setNewGuide({ ...newGuide, tag: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Source name optional"
        value={newGuide.source}
        onChange={(e) =>
          setNewGuide({ ...newGuide, source: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Source link optional"
        value={newGuide.link}
        onChange={(e) =>
          setNewGuide({ ...newGuide, link: e.target.value })
        }
      />

      <button type="submit" className="login-btn">
        Add Guide
      </button>
    </form>
  </section>
)}
      <section className="autism-content-layout">
        <div className="autism-card-grid">
          {filteredCards.map((item, index) => (
            <article className="autism-info-card" key={item.title}>
              <div className="autism-card-top">
                <div className="autism-icon">{item.icon}</div>
                <span>{item.tag}</span>
              </div>

              <h3>{item.title}</h3>
              <p>{item.text}</p>

                {item.source && item.link && (
  <div className="source-box">
    <small>Source used:</small>
    <a href={item.link} target="_blank" rel="noreferrer">
      {item.source}
    </a>
  </div>
)}
          {isAdmin && adminGuides.includes(item) && (
  <button
    type="button"
    className="delete-guide-btn"
    onClick={() => handleDeleteGuide(adminGuides.indexOf(item))}
  >
    Delete
  </button>
)}   </article>
          ))}
        </div>

        <aside className="autism-side-panel">
          <h2>Quick Support Tips</h2>

          <ul>
            {quickTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>

          <div className="important-note">
            <strong>Important</strong>
            <p>
              This page is educational only. It does not replace diagnosis or
              medical advice from a licensed specialist.
            </p>
          </div>

          <div className="source-list">
            <h3>Trusted Sources</h3>
            <a href="https://www.cdc.gov/autism/" target="_blank" rel="noreferrer">
              CDC
            </a>
            <a href="https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders" target="_blank" rel="noreferrer">
              WHO
            </a>
            <a href="https://www.nhs.uk/conditions/autism/" target="_blank" rel="noreferrer">
              NHS
            </a>
            <a href="https://www.aap.org/" target="_blank" rel="noreferrer">
              American Academy of Pediatrics
            </a>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default AutismGuide;