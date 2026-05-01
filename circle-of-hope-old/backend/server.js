const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());         
app.use(express.json());
app.get("/test-file", (req, res) => {
  res.sendFile(path.join(__dirname, "uploads", "test.jpg"));
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/debug-uploads", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");

  res.json({
    uploadsDir,
    files: fs.existsSync(uploadsDir)
      ? fs.readdirSync(uploadsDir)
      : [],
  });
});
;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "circle_of_hope",
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  bio: user.bio || "",
  location: user.location || "",
  specialty: user.specialty || "",
  is_verified: Boolean(user.is_verified),
  profile_pic: user.profile_pic || "",
});

async function initializeDatabase() {
  await runQuery(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255),
    role ENUM('parent','specialist','admin'),
    bio TEXT,
    specialty VARCHAR(120),
    is_verified TINYINT(1) DEFAULT 0,
    profile_pic VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

     await runQuery(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255),
    role ENUM('parent','specialist','admin'),
    bio TEXT,
    specialty VARCHAR(120),
    is_verified TINYINT(1) DEFAULT 0,
    profile_pic VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await runQuery(`
  CREATE TABLE IF NOT EXISTS follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_follow (follower_id, following_id)
  )
`);


  const posts = await runQuery(
  `SELECT p.*, u.name, u.role, u.is_verified, u.specialty, u.profile_pic
   FROM posts p
   JOIN users u ON p.user_id = u.id
   ORDER BY p.created_at DESC`

  );

  const comments = await runQuery(
  `SELECT c.*, u.name, u.role, u.is_verified, u.specialty, u.profile_pic
   FROM comments c
   JOIN users u ON c.user_id = u.id`
);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT,
      user_id INT,
      UNIQUE KEY unique_like (post_id, user_id)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS resources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200),
      category ENUM('article','center','doctor'),
      description TEXT,
      contact_info VARCHAR(200),
      location VARCHAR(200),
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await runQuery(`ALTER TABLE users ADD COLUMN profile_pic VARCHAR(255) NULL`);
  } catch (e) {}
}

// AUTH
app.post("/register", async (req, res) => {
  const { name, email, password, role, location } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await runQuery(
      "INSERT INTO users (name,email,password,role,is_verified,location) VALUES (?,?,?,?,?,?)",
[name, email, hashed, role, role === "specialist" ? 1 : 0, location]
    );

    const users = await runQuery("SELECT * FROM users WHERE id = ?", [
      result.insertId,
    ]);

    res.json({ user: formatUser(users[0]) });
  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: "Register error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await runQuery("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, users[0].password);

    if (!match) {
      return res.status(401).json({ message: "Wrong password" });
    }

    res.json({ user: formatUser(users[0]) });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login error" });
  }
});

// PROFILE
app.get("/profile/:id", async (req, res) => {
  try {
    const users = await runQuery("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(formatUser(users[0]));
  } catch (err) {
    console.log("PROFILE ERROR:", err);
    res.status(500).json({ message: "Profile error" });
  }
});

app.put("/profile/:id", async (req, res) => {
  const { name, bio, specialty, location } = req.body;

  try {
    await runQuery(
     "UPDATE users SET name=?, bio=?, specialty=?, location=? WHERE id=?",
[name, bio, specialty, location, req.params.id]
    );

    const users = await runQuery("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);

    res.json({ user: formatUser(users[0]) });
  } catch (err) {
    console.log("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Update error" });
  }
});

app.post("/upload-profile-pic/:id", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = `/uploads/${req.file.filename}`;

    await runQuery("UPDATE users SET profile_pic=? WHERE id=?", [
      filePath,
      req.params.id,
    ]);

    const users = await runQuery("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);
    
    res.json({ user: formatUser(users[0]) });
  } catch (error) {
    console.log("UPLOAD ERROR:", error);
    res.status(500).json({ message: "Upload error" });
  }
});

// POSTS
app.get("/posts", async (req, res) => {
  try {
    const posts = await runQuery(
      `SELECT p.*, u.name, u.role, u.is_verified, u.specialty, u.profile_pic
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );

    const comments = await runQuery(
      `SELECT c.*, u.name, u.role, u.is_verified, u.specialty, u.profile_pic
       FROM comments c
       JOIN users u ON c.user_id = u.id`
    );

    const likes = await runQuery("SELECT * FROM likes");

    const result = posts.map((p) => ({
      ...p,
      likes_count: likes.filter((l) => l.post_id === p.id).length,
      liked_by_current_user: likes.some(
        (l) => l.post_id === p.id && l.user_id == req.query.userId
      ),
      comments: comments.filter((c) => c.post_id === p.id),
    }));

    res.json(result);
  } catch (err) {
    console.log("POSTS ERROR:", err);
    res.status(500).json({ message: "Posts error" });
  }
});

app.post("/posts", async (req, res) => {
  const { userId, content } = req.body;

  try {
    await runQuery("INSERT INTO posts (user_id,content) VALUES (?,?)", [
      userId,
      content,
    ]);
    res.json({ message: "Post created" });
  } catch (err) {
    console.log("CREATE POST ERROR:", err);
    res.status(500).json({ message: "Create post error" });
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    await runQuery("DELETE FROM posts WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.log("DELETE POST ERROR:", err);
    res.status(500).json({ message: "Delete error" });
  }
});

// COMMENTS
app.post("/posts/:id/comments", async (req, res) => {
  const { userId, content } = req.body;

  try {
    await runQuery(
      "INSERT INTO comments (post_id,user_id,content) VALUES (?,?,?)",
      [req.params.id, userId, content]
    );
    res.json({ message: "Comment added" });
  } catch (err) {
    console.log("COMMENT ERROR:", err);
    res.status(500).json({ message: "Comment error" });
  }
});

app.delete("/comments/:id", async (req, res) => {
  try {
    await runQuery("DELETE FROM comments WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.log("DELETE COMMENT ERROR:", err);
    res.status(500).json({ message: "Delete error" });
  }
});

// LIKES
app.post("/posts/:id/like", async (req, res) => {
  const { userId } = req.body;

  try {
    const exists = await runQuery(
      "SELECT * FROM likes WHERE post_id=? AND user_id=?",
      [req.params.id, userId]
    );

    if (exists.length > 0) {
      await runQuery("DELETE FROM likes WHERE post_id=? AND user_id=?", [
        req.params.id,
        userId,
      ]);
    } else {
      await runQuery("INSERT INTO likes (post_id,user_id) VALUES (?,?)", [
        req.params.id,
        userId,
      ]);
    }

    res.json({ message: "Like updated" });
  } catch (err) {
    console.log("LIKE ERROR:", err);
    res.status(500).json({ message: "Like error" });
  }
});

// RESOURCES
app.get("/resources", async (req, res) => {
  try {
    const data = await runQuery("SELECT * FROM resources");
    res.json(data);
  } catch (err) {
    console.log("RESOURCES ERROR:", err);
    res.status(500).json({ message: "Resources error" });
  }
});

app.post("/resources", async (req, res) => {
  const { title, category, description, contact_info, location, created_by } =
    req.body;

  try {
    await runQuery(
      "INSERT INTO resources (title,category,description,contact_info,location,created_by) VALUES (?,?,?,?,?,?)",
      [title, category, description, contact_info, location, created_by]
    );

    res.json({ message: "Resource added" });
  } catch (err) {
    console.log("ADD RESOURCE ERROR:", err);
    res.status(500).json({ message: "Resource add error" });
  }
});

// TEST / HEALTH
app.get("/route-test", (req, res) => {
  res.send("NEW_SERVER_FILE_IS_RUNNING");
});

app.get("/health", (req, res) => {
  res.json({ message: "NEW BACKEND VERSION 123" });
});

// START
db.connect(async (err) => {
  if (err) {
    console.log("DB ERROR:", err);
    return;
  }

  console.log("MySQL Connected");
  await initializeDatabase();
  console.log("Database initialized");
});
app.get("/users/:currentUserId", (req, res) => {
  const currentUserId = req.params.currentUserId;

  const sql = `
    SELECT 
      u.id,
      u.name,
      u.role,
      u.specialty,
      u.profile_pic,
      CASE 
        WHEN f.follower_id IS NOT NULL THEN 1
        ELSE 0
      END AS is_following
    FROM users u
    LEFT JOIN follows f
      ON f.following_id = u.id
      AND f.follower_id = ?
    WHERE u.id != ?
    ORDER BY u.name ASC
  `;

  db.query(sql, [currentUserId, currentUserId], (err, results) => {
    if (err) {
      console.error("Get users error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});
//helps your Users page show whether I already follow someone.
app.get("/users/:currentUserId", (req, res) => {
  const currentUserId = req.params.currentUserId;

  const sql = `
    SELECT 
      u.id,
      u.name,
      u.role,
      u.specialty,
      u.profile_pic,
      CASE 
        WHEN f.follower_id IS NOT NULL THEN 1
        ELSE 0
      END AS is_following
    FROM users u
    LEFT JOIN follows f
      ON f.following_id = u.id
      AND f.follower_id = ?
    WHERE u.id != ?
    ORDER BY u.name ASC
  `;

  db.query(sql, [currentUserId, currentUserId], (err, results) => {
    if (err) {
      console.error("Get users error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

//get a single user profile
app.get("/profile/:id", (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT id, name, email, role, specialty, profile_pic
    FROM users
    WHERE id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Profile error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(results[0]);
  });
});
//Get posts of a specific profile
app.get("/user-posts/:id", (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT p.*, u.name, u.profile_pic
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("User posts error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});
//following
app.post("/follow", (req, res) => {
  const { follower_id, following_id } = req.body;

  if (!follower_id || !following_id) {
    return res.status(400).json({ error: "Missing user IDs" });
  }

  if (follower_id == following_id) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  const sql = `
    INSERT IGNORE INTO follows (follower_id, following_id)
    VALUES (?, ?)
  `;

  db.query(sql, [follower_id, following_id], (err, result) => {
    if (err) {
      console.error("Follow error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "Followed successfully" });
  });
});
// unfollow
app.post("/unfollow", (req, res) => {
  const { follower_id, following_id } = req.body;

  const sql = `
    DELETE FROM follows
    WHERE follower_id = ? AND following_id = ?
  `;

  db.query(sql, [follower_id, following_id], (err, result) => {
    if (err) {
      console.error("Unfollow error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "Unfollowed successfully" });
  });
});
app.get("/AYA-TEST-123", (req, res) => {
  res.send("AYA WORKING ✅");
});
app.get("/feed/:userId", async (req, res) => {
  const userId = Number(req.params.userId);

  try {
    const posts = await runQuery(
      `SELECT p.*, u.name, u.role, u.is_verified, u.specialty, u.profile_pic
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
          OR p.user_id IN (
            SELECT following_id FROM follows WHERE follower_id = ?
          )
       ORDER BY p.created_at DESC`,
      [userId, userId]
    );

    const comments = await runQuery(
      `SELECT c.*, u.name, u.role, u.is_verified, u.specialty, u.profile_pic
       FROM comments c
       JOIN users u ON c.user_id = u.id`
    );

    const likes = await runQuery("SELECT * FROM likes");

    const result = posts.map((p) => ({
      ...p,
      likes_count: likes.filter((l) => l.post_id === p.id).length,
      liked_by_current_user: likes.some(
        (l) => l.post_id === p.id && l.user_id == userId
      ),
      comments: comments.filter((c) => c.post_id === p.id),
    }));

    res.json(result);
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ message: "Feed error" });
  }
});
app.get("/follow-stats/:userId", (req, res) => {
  const userId = req.params.userId;

  const followersQuery = `
    SELECT COUNT(*) AS followers 
    FROM follows 
    WHERE following_id = ?
  `;

  const followingQuery = `
    SELECT COUNT(*) AS following 
    FROM follows 
    WHERE follower_id = ?
  `;

  db.query(followersQuery, [userId], (err, followersResult) => {
    if (err) return res.status(500).json({ error: err });

    db.query(followingQuery, [userId], (err, followingResult) => {
      if (err) return res.status(500).json({ error: err });

      res.json({
        followers: followersResult[0].followers,
        following: followingResult[0].following,
      });
    });
  });
});
  app.get("/followers/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT u.id, u.name, u.profile_pic
    FROM follows f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});
app.get("/following/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT u.id, u.name, u.profile_pic
    FROM follows f
    JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});
app.post("/chatbot", async (req, res) => {
  try {
    const message = (req.body.message || "").trim();

    if (!message) {
      return res.json({ reply: "Please type something to search." });
    }

    const search = `%${message}%`;

    const results = await runQuery(
      `SELECT * FROM resources
       WHERE title LIKE ?
       OR description LIKE ?
       OR location LIKE ?
       OR category LIKE ?
       LIMIT 5`,
      [search, search, search, search]
    );

    if (results.length === 0) {
      return res.json({
        reply: "No matching resources found.",
      });
    }

    return res.json({ reply: results });
  } catch (err) {
    console.log("CHATBOT ERROR:", err);
    return res.status(500).json({ reply: "Server error" });
  }
});
app.get("/", (req, res) => {
  res.send("Circle of Hope backend is running ✅");
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});