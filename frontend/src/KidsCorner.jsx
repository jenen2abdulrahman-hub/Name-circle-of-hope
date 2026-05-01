import React, { useMemo, useState } from "react";
import Layout from "./Layout";
import "./App.css";

const colors = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#facc15" },
];

const shapes = [
  { name: "Circle", icon: "⚪" },
  { name: "Star", icon: "⭐" },
  { name: "Heart", icon: "❤️" },
  { name: "Square", icon: "⬛" },
];

const emotions = [
  { name: "Happy", icon: "😊" },
  { name: "Sad", icon: "😢" },
  { name: "Angry", icon: "😡" },
  { name: "Tired", icon: "😴" },
];

const memoryIcons = ["🧩", "🎈", "⭐", "🍎"];

const levelGames = {
  level1: [
    {
      id: "memory",
      title: "Memory Match",
      icon: "🧠",
      text: "Find matching pictures.",
    },
    {
      id: "colors",
      title: "Color Match",
      icon: "🎨",
      text: "Choose the correct color.",
    },
  ],
  level2: [
    {
      id: "emotions",
      title: "Feeling Cards",
      icon: "😊",
      text: "Choose how you feel.",
    },
    {
      id: "shapes",
      title: "Shape Match",
      icon: "🔷",
      text: "Find the matching shape.",
    },
  ],
  level3: [
    {
      id: "tap",
      title: "Tap Stars",
      icon: "⭐",
      text: "Tap the big star.",
    },
    {
      id: "calm",
      title: "Calm Breathing",
      icon: "🌬️",
      text: "Breathe slowly.",
    },
  ],
};

function KidsCorner() {
  const [level, setLevel] = useState("level1");
  const [activeGame, setActiveGame] = useState(null);
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("Choose a game!");

  const [targetColor, setTargetColor] = useState(colors[0]);
  const [targetShape, setTargetShape] = useState(shapes[0]);
  const [breathStep, setBreathStep] = useState("Breathe In 🌬️");

  const firstCards = useMemo(() => {
    return [...memoryIcons, ...memoryIcons]
      .map((icon, index) => ({
        id: index,
        icon,
        flipped: false,
        matched: false,
      }))
      .sort(() => Math.random() - 0.5);
  }, []);

  const [cards, setCards] = useState(firstCards);
  const [firstCard, setFirstCard] = useState(null);

  const addStar = (count = 1) => {
    setStars((prev) => prev + count);
  };

  const changeLevel = (newLevel) => {
    setLevel(newLevel);
    setActiveGame(null);
    setMessage("Choose a game!");
  };

  const chooseColor = (color) => {
    if (color.name === targetColor.name) {
      addStar();
      setMessage("Great color! ⭐");
      setTargetColor(colors[Math.floor(Math.random() * colors.length)]);
    } else {
      setMessage("Try again 💙");
    }
  };

  const chooseShape = (shape) => {
    if (shape.name === targetShape.name) {
      addStar();
      setMessage("Great shape! ⭐");
      setTargetShape(shapes[Math.floor(Math.random() * shapes.length)]);
    } else {
      setMessage("Try again 💙");
    }
  };

  const chooseEmotion = (emotion) => {
    addStar();
    setMessage(`You chose ${emotion.name} ${emotion.icon}`);
  };

  const tapStar = () => {
    addStar();
    setMessage("Good job! ⭐");
  };

  const nextBreath = () => {
    if (breathStep.includes("In")) {
      setBreathStep("Hold 🤲");
    } else if (breathStep.includes("Hold")) {
      setBreathStep("Breathe Out 🍃");
    } else {
      setBreathStep("Breathe In 🌬️");
      addStar();
      setMessage("Calm and safe 🌈");
    }
  };

  const flipCard = (card) => {
    if (card.flipped || card.matched) return;

    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, flipped: true } : c))
    );

    if (!firstCard) {
      setFirstCard(card);
      return;
    }

    if (firstCard.icon === card.icon) {
      setCards((prev) =>
        prev.map((c) =>
          c.icon === card.icon ? { ...c, flipped: true, matched: true } : c
        )
      );
      setFirstCard(null);
      addStar(2);
      setMessage("Nice match! ⭐");
    } else {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstCard.id || c.id === card.id
              ? { ...c, flipped: false }
              : c
          )
        );
        setFirstCard(null);
        setMessage("Try another pair 💙");
      }, 700);
    }
  };

  const resetMemory = () => {
    const reset = [...memoryIcons, ...memoryIcons]
      .map((icon, index) => ({
        id: index,
        icon,
        flipped: false,
        matched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setCards(reset);
    setFirstCard(null);
    setMessage("New memory game!");
  };

  return (
    <Layout>
      <div className="kids-simple-page">
        <section className="kids-simple-hero">
          <div>
            <h1>🌈 Let’s Play!</h1>
            <p>Choose your level, enter a game, and collect stars.</p>
          </div>

          <div className="kids-stars-box">
            <span>⭐</span>
            <strong>{stars}</strong>
            <p>Stars</p>
          </div>
        </section>

        <section className="kids-level-selector">
          <button
            className={level === "level1" ? "active-level" : ""}
            onClick={() => changeLevel("level1")}
          >
            🟢 Level 1
            <small>More focus</small>
          </button>

          <button
            className={level === "level2" ? "active-level" : ""}
            onClick={() => changeLevel("level2")}
          >
            🟡 Level 2
            <small>Medium support</small>
          </button>

          <button
            className={level === "level3" ? "active-level" : ""}
            onClick={() => changeLevel("level3")}
          >
            🔴 Level 3
            <small>Simple & calm</small>
          </button>
        </section>

        {!activeGame && (
          <section className="kid-game-selector">
            <h2>Choose a Game</h2>

            <div className="kid-game-cards">
              {levelGames[level].map((game) => (
                <button
                  key={game.id}
                  className="kid-enter-game-card"
                  onClick={() => {
                    setActiveGame(game.id);
                    setMessage("You can do it!");
                  }}
                >
                  <span>{game.icon}</span>
                  <h3>{game.title}</h3>
                  <p>{game.text}</p>
                  <strong>Enter Game</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeGame && (
          <section className="kids-game-simple">
            <button
              className="kid-back-btn"
              onClick={() => {
                setActiveGame(null);
                setMessage("Choose a game!");
              }}
            >
              ← Back to Games
            </button>

            <h2>{message}</h2>

            {activeGame === "colors" && (
              <>
                <p>Find this color:</p>

                <div
                  className="kid-target-color"
                  style={{ background: targetColor.value }}
                >
                  {targetColor.name}
                </div>

                <div className="kid-color-buttons">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      style={{ background: color.value }}
                      onClick={() => chooseColor(color)}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeGame === "memory" && (
              <>
                <div className="kid-game-header">
                  <p>Find the matching pictures.</p>
                  <button onClick={resetMemory}>Restart</button>
                </div>

                <div className="kid-memory-grid">
                  {cards.map((card) => (
                    <button
                      key={card.id}
                      className={card.flipped || card.matched ? "open" : ""}
                      onClick={() => flipCard(card)}
                    >
                      {card.flipped || card.matched ? card.icon : "?"}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeGame === "emotions" && (
              <>
                <p>How do you feel?</p>

                <div className="kids-emotions">
                  {emotions.map((emotion) => (
                    <button
                      key={emotion.name}
                      onClick={() => chooseEmotion(emotion)}
                    >
                      <span>{emotion.icon}</span>
                      {emotion.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeGame === "shapes" && (
              <>
                <p>Find this shape:</p>

                <div className="kid-shape-target">
                  {targetShape.icon}
                  <span>{targetShape.name}</span>
                </div>

                <div className="kid-shape-buttons">
                  {shapes.map((shape) => (
                    <button key={shape.name} onClick={() => chooseShape(shape)}>
                      <span>{shape.icon}</span>
                      {shape.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeGame === "tap" && (
              <>
                <p>Tap the big star.</p>

                <button className="kid-big-star" onClick={tapStar}>
                  ⭐
                </button>
              </>
            )}

            {activeGame === "calm" && (
              <>
                <p>Follow the circle and breathe slowly.</p>

                <div className="kid-breathe-circle">{breathStep}</div>

                <button className="kid-next-btn" onClick={nextBreath}>
                  Next
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}

export default KidsCorner;