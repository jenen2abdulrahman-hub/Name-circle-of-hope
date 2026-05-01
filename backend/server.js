
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use("/uploads", express.static(uploadsDir));

app.get("/test-file", (req, res) => {
  res.sendFile(path.join(__dirname, "uploads", "test.jpg"));
});

app.get("/debug-uploads", (req, res) => {
  res.json({
    uploadsDir,
    files: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [],
  });
});


const db = mysql.createConnection({
  host: "bczwmoc6p1vzdxgiuqkz-mysql.services.clever-cloud.com",
  user: "uoboubew7x7mwnqa",
  password: "TxVS3tiypPNNIziVyhk1",
  database: "bczwmoc6p1vzdxgiuqkz",
  port: 3306,
  ssl: { rejectUnauthorized: false }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
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
  verification_file: user.verification_file || "",
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
      location VARCHAR(200),
      specialty VARCHAR(120),
      is_verified TINYINT(1) DEFAULT 0,
      profile_pic VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
await runQuery(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    actor_id INT NULL,
    type VARCHAR(100),
    message TEXT,
    link VARCHAR(255),
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
  await runQuery(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      content TEXT,
      image VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT,
      user_id INT,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT,
      user_id INT,
      UNIQUE KEY unique_like (post_id, user_id)
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
    await runQuery(`ALTER TABLE users ADD COLUMN location VARCHAR(200)`);
  } catch (e) {}

  try {
    await runQuery(`ALTER TABLE users ADD COLUMN profile_pic VARCHAR(255) NULL`);
  } catch (e) {}

  try {
    await runQuery(`ALTER TABLE posts ADD COLUMN image VARCHAR(255) NULL`);
  } catch (e) {}
}

/* AUTH */

app.post("/register", upload.single("verificationFile"), async (req, res) => {
  const { name, email, password, role, location } = req.body;
  const verificationFile =
  role === "specialist" && req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await runQuery(
      "INSERT INTO users (name,email,password,role,is_verified,location,verification_file) VALUES (?,?,?,?,?,?,?)",
[name, email, hashed, role, 0, location, verificationFile]
    );

    const users = await runQuery("SELECT * FROM users WHERE id = ?", [
      result.insertId,
    ]);
    if (role === "specialist") {
  const admins = await runQuery("SELECT id FROM users WHERE role='admin'");

  for (const admin of admins) {
    await createNotification({
      user_id: admin.id,
      actor_id: result.insertId,
      type: "specialist_register",
      message: `${name} registered as a specialist and needs verification.`,
      link: "/admin",
    });
  }
}

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

/* PROFILE */

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

/* POSTS */

app.get("/posts", async (req, res) => {
  const userId = req.query.userId;

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
        (l) => l.post_id === p.id && l.user_id == userId
      ),
      comments: comments.filter((c) => c.post_id === p.id),
    }));

    res.json(result);
  } catch (err) {
    console.log("POSTS ERROR:", err);
    res.status(500).json({ message: "Posts error" });
  }
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
    console.error("FEED ERROR:", err);
    res.status(500).json({ message: "Feed error" });
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

app.post("/posts-with-image", upload.single("image"), async (req, res) => {
  const { userId, content } = req.body;

  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    await runQuery(
      "INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)",
      [userId, content, imagePath]
    );

    res.json({ message: "Post with image created" });
  } catch (err) {
    console.log("CREATE IMAGE POST ERROR:", err);
    res.status(500).json({ message: "Create image post error" });
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    app.deawait; runQuery("DELETE FROM comments WHERE post_id=?", [req.params.id]);
    await runQuery("DELETE FROM likes WHERE post_id=?", [req.params.id]);
    await runQuery("DELETE FROM posts WHERE id=?", [req.params.id]);

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.log("DELETE POST ERROR:", err);
    res.status(500).json({ message: "Delete error" });
  }
});

/* COMMENTS */

app.post("/posts/:id/comments", async (req, res) => {
  const { userId, content } = req.body;

  try {
    // ✅ 1. Add comment
    await runQuery(
      "INSERT INTO comments (post_id,user_id,content) VALUES (?,?,?)",
      [req.params.id, userId, content]
    );
    try {
  await runQuery(`ALTER TABLE users ADD COLUMN verification_file VARCHAR(255) NULL`);
} catch (e) {}

    // ✅ 2. Get post owner
    const postOwner = await runQuery(
      "SELECT user_id FROM posts WHERE id=?",
      [req.params.id]
    );

    // ✅ 3. Create notification
    if (postOwner.length > 0) {
      await createNotification({
        user_id: postOwner[0].user_id, // who gets notification
        actor_id: userId,              // who commented
        type: "comment",
        message: "commented on your post",
        link: `/dashboard`,
      });
    }

    res.json({ message: "Comment added" });

  } catch (err) {
    console.log("COMMENT ERROR:", err);
    res.status(500).json({ message: "Comment error" });
  }
});

app.delete("/comments/:id", async (req, res) => {
  const { userId } = req.body;

  try {
    const comment = await runQuery("SELECT * FROM comments WHERE id=?", [
      req.params.id,
    ]);

    if (comment.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const ownerId = comment[0].user_id;

    const user = await runQuery("SELECT role FROM users WHERE id=?", [
      userId,
    ]);

    const isAdmin = user[0]?.role === "admin";

    if (ownerId != userId && !isAdmin) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await runQuery("DELETE FROM comments WHERE id=?", [req.params.id]);

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Delete error" });
  }
});


/* LIKES */

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

      const postOwner = await runQuery(
        "SELECT user_id FROM posts WHERE id=?",
        [req.params.id]
      );

      if (postOwner.length > 0) {
        await createNotification({
          user_id: postOwner[0].user_id,
          actor_id: userId,
          type: "like",
          message: "liked your post",
          link: `/dashboard`,
        });
      }
    }

    res.json({ message: "Like updated" });
  } catch (err) {
    console.log("LIKE ERROR:", err);
    res.status(500).json({ message: "Like error" });
  }
});

/* USERS + FOLLOW */

app.get("/users/:currentUserId", async (req, res) => {
  const currentUserId = req.params.currentUserId;

  try {
    const users = await runQuery(
      `SELECT 
        u.id,
        u.name,
        u.role,
        u.specialty,
        u.profile_pic,
        u.is_verified,
        CASE 
          WHEN f.follower_id IS NOT NULL THEN 1
          ELSE 0
        END AS is_following
      FROM users u
      LEFT JOIN follows f
        ON f.following_id = u.id
        AND f.follower_id = ?
      WHERE u.id != ?
        AND u.role != 'admin'
        AND (
          u.role != 'specialist'
          OR u.is_verified = 1
        )
      ORDER BY u.name ASC`,
      [currentUserId, currentUserId]
    );

    res.json(users);
  } catch (err) {
    console.log("USERS ERROR:", err);
    res.status(500).json({ message: "Users error" });
  }
});


app.post("/follow", async (req, res) => {
  const { follower_id, following_id } = req.body;

  if (!follower_id || !following_id) {
    return res.status(400).json({ error: "Missing user IDs" });
  }

  if (follower_id == following_id) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  try {
    // ✅ insert follow
    await runQuery(
      `INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)`,
      [follower_id, following_id]
    );

    // ✅ ADD NOTIFICATION HERE 👇
    await createNotification({
      user_id: following_id,        // the one who gets notified
      actor_id: follower_id,        // the one who did the action
      type: "follow",
      message: "started following you",
      link: `/profile/${follower_id}`,
    });

    res.json({ message: "Followed successfully" });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/unfollow", async (req, res) => {
  const { follower_id, following_id } = req.body;

  try {
    await runQuery(
      "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
      [follower_id, following_id]
    );

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.log("UNFOLLOW ERROR:", err);
    res.status(500).json({ message: "Unfollow error" });
  }
});

app.get("/follow-stats/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const followersResult = await runQuery(
      "SELECT COUNT(*) AS followers FROM follows WHERE following_id = ?",
      [userId]
    );

    const followingResult = await runQuery(
      "SELECT COUNT(*) AS following FROM follows WHERE follower_id = ?",
      [userId]
    );

    res.json({
      followers: followersResult[0].followers,
      following: followingResult[0].following,
    });
  } catch (err) {
    console.log("FOLLOW STATS ERROR:", err);
    res.status(500).json({ message: "Follow stats error" });
  }
});

app.get("/followers/:userId", async (req, res) => {
  try {
    const result = await runQuery(
      `SELECT u.id, u.name, u.profile_pic
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ?`,
      [req.params.userId]
    );

    res.json(result);
  } catch (err) {
    console.log("FOLLOWERS ERROR:", err);
    res.status(500).json({ message: "Followers error" });
  }
});

app.get("/following/:userId", async (req, res) => {
  try {
    const result = await runQuery(
      `SELECT u.id, u.name, u.profile_pic
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = ?`,
      [req.params.userId]
    );

    res.json(result);
  } catch (err) {
    console.log("FOLLOWING ERROR:", err);
    res.status(500).json({ message: "Following error" });
  }
});

/* USER POSTS */

app.get("/user-posts/:id", async (req, res) => {
  try {
    const result = await runQuery(
      `SELECT p.*, u.name, u.profile_pic
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.params.id]
    );

    res.json(result);
  } catch (err) {
    console.log("USER POSTS ERROR:", err);
    res.status(500).json({ message: "User posts error" });
  }
});

/* RESOURCES */

app.get("/resources", async (req, res) => {
  try {
    const data = await runQuery(`
      SELECT 
        r.*,
        u.name AS creator_name,
        u.role AS creator_role,
        COALESCE(AVG(rr.rating), 0) AS avg_rating,
        COUNT(rr.id) AS rating_count
      FROM resources r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN resource_ratings rr ON r.id = rr.resource_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

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

/* ADMIN */

app.get("/admin/stats", async (req, res) => {
  try {
    const users = await runQuery("SELECT COUNT(*) AS total FROM users");
    const parents = await runQuery(
      "SELECT COUNT(*) AS total FROM users WHERE role='parent'"
    );
    const specialists = await runQuery(
      "SELECT COUNT(*) AS total FROM users WHERE role='specialist'"
    );
    const admins = await runQuery(
      "SELECT COUNT(*) AS total FROM users WHERE role='admin'"
    );
    const posts = await runQuery("SELECT COUNT(*) AS total FROM posts");
    const comments = await runQuery("SELECT COUNT(*) AS total FROM comments");
    const resources = await runQuery("SELECT COUNT(*) AS total FROM resources");

    res.json({
      users: users[0].total,
      parents: parents[0].total,
      specialists: specialists[0].total,
      admins: admins[0].total,
      posts: posts[0].total,
      comments: comments[0].total,
      resources: resources[0].total,
    });
  } catch (err) {
    console.log("ADMIN STATS ERROR:", err);
    res.status(500).json({ message: "Admin stats error" });
  }
});

app.get("/admin/users", async (req, res) => {
  try {
    const users = await runQuery(
      `SELECT id, name, email, role, specialty, location, is_verified, profile_pic, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(users);
  } catch (err) {
    console.log("ADMIN USERS ERROR:", err);
    res.status(500).json({ message: "Admin users error" });
  }
});

/* CHATBOT */

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

/* TEST */

app.get("/AYA-TEST-123", (req, res) => {
  res.send("AYA WORKING ✅");
});

app.get("/route-test", (req, res) => {
  res.send("NEW_SERVER_FILE_IS_RUNNING");
});

app.get("/health", (req, res) => {
  res.json({ message: "BACKEND WORKING WITH IMAGE POSTS + ADMIN" });
});
/* ADMIN POSTS */
app.get("/admin/posts/:adminId", async (req, res) => {
  try {
    const posts = await runQuery(
      `SELECT p.*, u.name, u.role, u.profile_pic
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );

    res.json(posts);
  } catch (err) {
    console.log("ADMIN POSTS ERROR:", err);
    res.status(500).json({ message: "Admin posts error" });
  }
});

/* ADMIN COMMENTS */
app.get("/admin/comments/:adminId", async (req, res) => {
  try {
    const comments = await runQuery(
      `SELECT c.*, u.name, u.role, u.profile_pic
       FROM comments c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC`
    );

    res.json(comments);
  } catch (err) {
    console.log("ADMIN COMMENTS ERROR:", err);
    res.status(500).json({ message: "Admin comments error" });
  }
});

/* ADMIN STATS WITH ID */
app.get("/admin/stats/:adminId", async (req, res) => {
  try {
    const totalUsers = await runQuery("SELECT COUNT(*) AS total FROM users");
    const totalParents = await runQuery(
      "SELECT COUNT(*) AS total FROM users WHERE role='parent'"
    );
    const totalSpecialists = await runQuery(
      "SELECT COUNT(*) AS total FROM users WHERE role='specialist'"
    );
    const totalPosts = await runQuery("SELECT COUNT(*) AS total FROM posts");
    const totalResources = await runQuery("SELECT COUNT(*) AS total FROM resources");

    res.json({
      totalUsers: totalUsers[0].total,
      totalParents: totalParents[0].total,
      totalSpecialists: totalSpecialists[0].total,
      totalPosts: totalPosts[0].total,
      totalResources: totalResources[0].total,
    });
  } catch (err) {
    console.log("ADMIN STATS ERROR:", err);
    res.status(500).json({ message: "Admin stats error" });
  }
});

/* ADMIN USERS WITH ID */
app.get("/admin/users/:adminId", async (req, res) => {
  try {
    const users = await runQuery(
      `SELECT id, name, email, role, specialty, location, is_verified, profile_pic, verification_file, created_at
 FROM users
 ORDER BY created_at DESC`
    );

    res.json(users);
  } catch (err) {
    console.log("ADMIN USERS ERROR:", err);
    res.status(500).json({ message: "Admin users error" });
  }
});

/* UPDATE USER ROLE / VERIFY */
app.put("/admin/users/:id", async (req, res) => {
  const { role, is_verified } = req.body;

  try {
    await runQuery(
      "UPDATE users SET role=?, is_verified=? WHERE id=?",
      [role, is_verified ? 1 : 0, req.params.id]
    );

    res.json({ message: "User updated" });
  } catch (err) {
    console.log("ADMIN UPDATE USER ERROR:", err);
    res.status(500).json({ message: "Update user error" });
  }
});

/* DELETE USER */
app.delete("/admin/users/:id", async (req, res) => {
  try {
    await runQuery("DELETE FROM comments WHERE user_id=?", [req.params.id]);
    await runQuery("DELETE FROM likes WHERE user_id=?", [req.params.id]);
    await runQuery("DELETE FROM follows WHERE follower_id=? OR following_id=?", [
      req.params.id,
      req.params.id,
    ]);
    await runQuery("DELETE FROM posts WHERE user_id=?", [req.params.id]);
    await runQuery("DELETE FROM users WHERE id=?", [req.params.id]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.log("ADMIN DELETE USER ERROR:", err);
    res.status(500).json({ message: "Delete user error" });
  }
});

/* DELETE POST */
app.delete("/admin/posts/:id", async (req, res) => {
  try {
    await runQuery("DELETE FROM comments WHERE post_id=?", [req.params.id]);
    await runQuery("DELETE FROM likes WHERE post_id=?", [req.params.id]);
    await runQuery("DELETE FROM posts WHERE id=?", [req.params.id]);

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.log("ADMIN DELETE POST ERROR:", err);
    res.status(500).json({ message: "Delete post error" });
  }
});

/* DELETE COMMENT */
app.delete("/admin/comments/:id", async (req, res) => {
  try {
    await runQuery("DELETE FROM comments WHERE id=?", [req.params.id]);

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.log("ADMIN DELETE COMMENT ERROR:", err);
    res.status(500).json({ message: "Delete comment error" });
  }
});
/* CHAT TABLES */
async function initializeChatTables() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user1_id INT NOT NULL,
      user2_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_conversation (user1_id, user2_id)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/* USERS I CAN CHAT WITH */
app.get("/chat-users/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const users = await runQuery(
      `
      SELECT DISTINCT u.id, u.name, u.role, u.profile_pic
      FROM users u
      JOIN follows f1 ON f1.following_id = u.id
      JOIN follows f2 ON f2.follower_id = u.id
      WHERE f1.follower_id = ?
      AND f2.following_id = ?
      AND u.id != ?
      ORDER BY u.name ASC
      `,
      [userId, userId, userId]
    );

    res.json(users);
  } catch (err) {
    console.log("CHAT USERS ERROR:", err);
    res.status(500).json({ message: "Chat users error" });
  }
});

/* GET OR CREATE CONVERSATION */
app.post("/conversations", async (req, res) => {
  const { user1_id, user2_id } = req.body;

  const smaller = Math.min(user1_id, user2_id);
  const larger = Math.max(user1_id, user2_id);

  try {
    await runQuery(
      "INSERT IGNORE INTO conversations (user1_id, user2_id) VALUES (?, ?)",
      [smaller, larger]
    );

    const conversation = await runQuery(
      "SELECT * FROM conversations WHERE user1_id=? AND user2_id=?",
      [smaller, larger]
    );

    res.json(conversation[0]);
  } catch (err) {
    console.log("CONVERSATION ERROR:", err);
    res.status(500).json({ message: "Conversation error" });
  }
});

/* GET MESSAGES */
app.get("/messages/:conversationId", async (req, res) => {
  try {
    const messages = await runQuery(
      `
      SELECT m.*, u.name, u.profile_pic
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
      `,
      [req.params.conversationId]
    );

    res.json(messages);
  } catch (err) {
    console.log("GET MESSAGES ERROR:", err);
    res.status(500).json({ message: "Messages error" });
  }
});

/* SEND MESSAGE */
app.post("/messages", async (req, res) => {
  const { conversation_id, sender_id, receiver_id, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message is empty" });
  }

  try {
    await runQuery(
      `
      INSERT INTO messages (conversation_id, sender_id, receiver_id, message)
      VALUES (?, ?, ?, ?)
      `,
      [conversation_id, sender_id, receiver_id, message]
    );

    res.json({ message: "Message sent" });
  } catch (err) {
    console.log("SEND MESSAGE ERROR:", err);
    res.status(500).json({ message: "Send message error" });
  }
});
/* STORIES */

app.post("/stories", upload.single("image"), async (req, res) => {
  const { userId, text } = req.body;

  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    await runQuery(
      "INSERT INTO stories (user_id, text, image) VALUES (?, ?, ?)",
      [userId, text || "", imagePath]
    );

    res.json({ message: "Story created" });
  } catch (err) {
    console.log("CREATE STORY ERROR:", err);
    res.status(500).json({ message: "Create story error" });
  }
});

app.get("/stories/:userId", async (req, res) => {
  try {
    const stories = await runQuery(
      `SELECT s.*, u.name, u.profile_pic, u.role
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.created_at >= NOW() - INTERVAL 24 HOUR
       ORDER BY s.created_at DESC`
    );

    res.json(stories);
  } catch (err) {
    console.log("GET STORIES ERROR:", err);
    res.status(500).json({ message: "Stories error" });
  }
});

app.delete("/stories/:id", async (req, res) => {
  const { userId } = req.body;

  try {
    const story = await runQuery("SELECT * FROM stories WHERE id=?", [
      req.params.id,
    ]);

    if (story.length === 0) {
      return res.status(404).json({ message: "Story not found" });
    }

    const user = await runQuery("SELECT role FROM users WHERE id=?", [userId]);
    const isAdmin = user[0]?.role === "admin";

    if (story[0].user_id != userId && !isAdmin) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await runQuery("DELETE FROM stories WHERE id=?", [req.params.id]);

    res.json({ message: "Story deleted" });
  } catch (err) {
    console.log("DELETE STORY ERROR:", err);
    res.status(500).json({ message: "Delete story error" });
  }
});
/* NOTIFICATIONS */

const createNotification = async ({ user_id, actor_id, type, message, link }) => {
  if (!user_id || user_id == actor_id) return;

  await runQuery(
    `INSERT INTO notifications (user_id, actor_id, type, message, link)
     VALUES (?, ?, ?, ?, ?)`,
    [user_id, actor_id || null, type, message, link || null]
  );
};

app.get("/notifications/:userId", async (req, res) => {
  try {
    const data = await runQuery(
      `SELECT n.*, u.name AS actor_name, u.profile_pic AS actor_pic
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [req.params.userId]
    );

    res.json(data);
  } catch (err) {
    console.log("NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Notifications error" });
  }
});

app.put("/notifications/read/:userId", async (req, res) => {
  try {
    await runQuery("UPDATE notifications SET is_read=1 WHERE user_id=?", [
      req.params.userId,
    ]);

    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Read notifications error" });
  }
});

app.delete("/notifications/:id", async (req, res) => {
  try {
    await runQuery("DELETE FROM notifications WHERE id=?", [req.params.id]);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete notification error" });
  }
});
app.post("/ai-advice", async (req, res) => {
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ message: "Question is required" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an autism support assistant for parents. Give safe, simple, practical educational advice. Do not diagnose. Tell the parent to consult a licensed specialist or doctor for medical concerns, danger, self-harm, severe aggression, or urgent issues. Keep the answer supportive and structured.",
        },
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0.5,
      max_tokens: 350,
    });

    res.json({
      answer: response.choices[0].message.content,
    });
  } catch (err) {
    console.log("AI ADVICE ERROR:", err);
    res.status(500).json({
      message: "AI advice error",
    });
  }
});
app.post("/resources/:id/rate", async (req, res) => {
  const { userId, rating } = req.body;

  try {
    await runQuery(
      `INSERT INTO resource_ratings (resource_id, user_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating=?`,
      [req.params.id, userId, rating, rating]
    );

    res.json({ message: "Rating saved" });
  } catch (err) {
    console.log("RATE ERROR:", err);
    res.status(500).json({ message: "Rating error" });
  }
});
/* ADMIN RESOURCES */

app.get("/admin/resources/:adminId", async (req, res) => {
  try {
    const resources = await runQuery(`
      SELECT r.*, u.name AS creator_name, u.role AS creator_role
      FROM resources r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.created_at DESC
    `);

    res.json(resources);
  } catch (err) {
    console.log("ADMIN RESOURCES ERROR:", err);
    res.status(500).json({ message: "Admin resources error" });
  }
});

app.delete("/admin/resources/:id", async (req, res) => {
  try {
    await runQuery("DELETE FROM resource_ratings WHERE resource_id=?", [
      req.params.id,
    ]);

    await runQuery("DELETE FROM resources WHERE id=?", [req.params.id]);

    res.json({ message: "Resource deleted" });
  } catch (err) {
    console.log("ADMIN DELETE RESOURCE ERROR:", err);
    res.status(500).json({ message: "Delete resource error" });
  }
});
/* START */

db.connect(async (err) => {
  if (err) {
    console.log("DB ERROR:", err);
    return;
  }

  console.log("MySQL Connected");

  try {
    await initializeDatabase();
    await initializeChatTables();
    console.log("Database initialized");
  } catch (error) {
    console.log("DATABASE INIT ERROR:", error);
  }
  app.get("/anonymous-questions", (req, res) => {
  const sql = "SELECT * FROM anonymous_questions ORDER BY created_at DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Fetch anonymous questions error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

app.post("/anonymous-questions", (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const sql = "INSERT INTO anonymous_questions (question) VALUES (?)";

  db.query(sql, [question], (err, result) => {
    if (err) {
      console.error("Add anonymous question error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      message: "Anonymous question added",
      id: result.insertId,
    });
  });
});
app.get("/", (req, res) => {
  res.send("Circle of Hope backend is running ✅");
});
 const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
});