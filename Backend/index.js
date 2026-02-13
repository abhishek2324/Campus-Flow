const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const fs=require("fs");

require("dotenv").config(); 

/* =======================
   IMPORT ROUTES & MODELS
======================= */

const adminDepartments = require("./Routes/adminDepartments");
const adminUsersRoutes = require("./Routes/adminUsers");
const studentRoutes = require("./Routes/student");
const hodRoutes = require("./Routes/hod");
const professorRoutes=require("./Routes/professor");

const User = require("./models/User");

/* =======================
   APP INIT
======================= */

const app = express();


app.use(cookieParser());
/* =======================
   CORS (LOCAL + VERCEL)
======================= */
app.use(
  cors({
    origin: true,   // reflect request origin
    credentials: true,
  })
);


app.use(express.json());

/* =======================
   STATIC FILES
======================= */

app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

/* =======================
   API ROUTES
======================= */

app.use("/", adminDepartments);
app.use("/admin", adminUsersRoutes);
app.use("/api/student", studentRoutes);
app.use("/hod", hodRoutes);
app.use("/api/professor", professorRoutes);


/* =======================
   HEALTH CHECK
======================= */

app.get("/api", (req, res) => {
  res.json({ message: "API running 🚀" });
});

/* =======================
   JWT HELPERS
======================= */

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ FATAL ERROR: JWT_SECRET missing");
  process.exit(1);
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}

/* =======================
   DB CONNECTION
======================= */

if (!process.env.MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI missing");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("MongoDB error:", err.message);
    process.exit(1);
  });

/* =======================
   ADMIN OVERVIEW
======================= */

app.get("/api/admin/overview", verifyToken, isAdmin, async (req, res) => {
  try {
    const Department = require("./models/Department");

    const totalDepartments = await Department.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalProfessors = await User.countDocuments({ role: "professor" });
    const totalHODs = await User.countDocuments({ role: "hod" });

    res.json({
      totalDepartments,
      totalUsers,
      totalStudents,
      totalProfessors,
      totalHODs,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   SIGNUP (FIXED PATH)
======================= */

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      role: role || "student",
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = app;


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken(user);

    return res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim())
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (user && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 15 * 60 * 1000;
      resetTokenStore.set(token, { userId: user._id.toString(), expiresAt });

      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
      await nodemailerTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Password Reset - Assignment Uploader",
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password (valid for 15 minutes):</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
    }

    return res.json({
      message: "If this email is registered, you will receive password reset instructions.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: "Token and password are required" });

    const stored = resetTokenStore.get(token);
    if (!stored || Date.now() > stored.expiresAt) {
      resetTokenStore.delete(token);
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const user = await User.findById(stored.userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    resetTokenStore.delete(token);

    return res.json({ message: "Password reset successfully. You can now login." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

const distPath = path.join(__dirname, "../Frontend/Assignment-uploader/dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.warn("⚠ Frontend build not found:", distPath);

  app.get("/", (req, res) => {
    res.send("Backend running. Frontend build not found.");
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
