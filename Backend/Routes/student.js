const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const Assignment = require("../models/Assignment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { verifyToken, isStudent } = require("../middleware/auth");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF files allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/professors", verifyToken, isStudent, async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    const filter = { role: "professor" };
    if (departmentId) {
      filter.departmentId = departmentId;
    }
    
    const professors = await User.find(filter)
      .select("_id name email departmentId")
      .populate("departmentId", "name")
      .lean();
    
    return res.json({ professors });
  } catch (err) {
    console.error("Get Professors Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/dashboard", verifyToken, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    const counts = await Assignment.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
    counts.forEach((c) => (stats[c._id] = c.count));

    const recent = await Assignment.find({ student: studentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.json({ stats, recent });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   USER STORY 2
   Upload Assignment (Single)
=========================== */

router.post(
  "/assignments/upload",
  verifyToken,
  isStudent,
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, description = "", category = "Assignment" } = req.body;

      if (!req.file)
        return res.status(400).json({ message: "PDF file is required" });
      if (!title)
        return res.status(400).json({ message: "Title is required" });

      const a = new Assignment({
        title,
        description,
        category,
        fileOriginalName: req.file.originalname,
        filePath: "/uploads/" + req.file.filename,
        fileSize: req.file.size,
        student: req.user.id,
        status: "draft",
      });

      await a.save();
      return res.status(201).json({ message: "Uploaded", id: a._id });
    } catch (err) {
      console.error("Upload Error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

/* ===========================
   USER STORY 3
   Bulk Upload (Max 5)
=========================== */

router.post(
  "/assignments/bulk-upload",
  verifyToken,
  isStudent,
  upload.array("files", 5),
  async (req, res) => {
    try {
      const { description = "", category = "Assignment" } = req.body;
      const files = req.files || [];

      if (!files.length)
        return res.status(400).json({ message: "No files uploaded" });

      const created = [];

      for (const f of files) {
        const a = new Assignment({
          title: f.originalname,
          description,
          category,
          fileOriginalName: f.originalname,
          filePath: "/uploads/" + f.filename,
          fileSize: f.size,
          student: req.user.id,
          status: "draft",
        });
        await a.save();
        created.push(a);
      }

      return res.status(201).json({ message: "Bulk uploaded", created });
    } catch (err) {
      console.error("Bulk Upload Error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

router.get("/assignments", verifyToken, isStudent, async (req, res) => {
  try {
    const { status, sort = "desc" } = req.query;
    const filter = { student: req.user.id };
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate("currentReviewer", "name email")
      .sort({ createdAt: sort === "asc" ? 1 : -1 });

    return res.json({ assignments });
  } catch (err) {
    console.error("List Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/assignments/:id", verifyToken, isStudent, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id).populate(
      "currentReviewer",
      "name email"
    );

    if (!a) return res.status(404).json({ message: "Not found" });
    if (a.student.toString() !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    return res.json({ assignment: a });
  } catch (err) {
    console.error("Single Assignment Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/assignments/:id/submit",
  verifyToken,
  isStudent,
  async (req, res) => {
    try {
      const { reviewerId } = req.body;
      if (!reviewerId)
        return res.status(400).json({ message: "Reviewer is required" });

      const assignment = await Assignment.findById(req.params.id);
      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });

      if (assignment.student.toString() !== req.user.id)
        return res.status(403).json({ message: "Forbidden" });

      if (assignment.status !== "draft")
        return res
          .status(400)
          .json({ message: "Only draft assignments can be submitted" });

      assignment.status = "submitted";
      assignment.currentReviewer = reviewerId;
      assignment.reviewerId = reviewerId;

      assignment.history = assignment.history || [];
      assignment.history.push({
        reviewerId,
        action: "submitted",
        date: new Date(),
      });

      await assignment.save();

      // Create notification for professor
      const student = await User.findById(req.user.id).select("name");
      await Notification.create({
        user: reviewerId,
        message: `New assignment "${assignment.title}" submitted by ${student?.name || "a student"} for review`,
        relatedAssignment: assignment._id,
      });

      return res.json({
        message: "Assignment submitted for review successfully",
      });
    } catch (err) {
      console.error("Submit Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/assignments/:id/history",
  verifyToken,
  isStudent,
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id)
        .populate("history.reviewerId", "name email")
        .populate("currentReviewer", "name email");

      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });

      if (assignment.student.toString() !== req.user.id)
        return res.status(403).json({ message: "Forbidden" });

      return res.json({
        status: assignment.status,
        currentReviewer: assignment.currentReviewer || null,
        history: assignment.history || [],
      });
    } catch (err) {
      console.error("History Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/assignments/:id/download",
  verifyToken,
  isStudent,
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });

      if (assignment.student.toString() !== req.user.id)
        return res.status(403).json({ message: "Forbidden" });

      const filePath = path.join(
        __dirname,
        "..",
        assignment.filePath.replace("/uploads/", "uploads/")
      );

      return res.download(filePath);
    } catch (err) {
      console.error("Download Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);


router.post(
  "/assignments/:id/resubmit",
  verifyToken,
  isStudent,
  upload.single("file"),
  async (req, res) => {
    try {
      const { description = "" } = req.body;

      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      if (assignment.student.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (assignment.status !== "rejected") {
        return res
          .status(400)
          .json({ message: "Only rejected assignments can be resubmitted" });
      }

      let newReviewerId = req.body.reviewerId || assignment.currentReviewer || assignment.reviewerId;
      if (!newReviewerId) {
        return res.status(400).json({ message: "Please select a professor to review your resubmission" });
      }

      const previousReviewerId = assignment.currentReviewer || assignment.reviewerId;

      assignment.history = assignment.history || [];

      if (req.file) {
        assignment.history.push({
          reviewerId: previousReviewerId,
          action: "resubmitted",
          remark: "Previous file replaced",
          oldFilePath: assignment.filePath,
          date: new Date()
        });

        assignment.fileOriginalName = req.file.originalname;
        assignment.filePath = "/uploads/" + req.file.filename;
        assignment.fileSize = req.file.size;
      } else {
        assignment.history.push({
          reviewerId: previousReviewerId,
          action: "resubmitted",
          remark: "Resubmitted without file change",
          date: new Date()
        });
      }

      if (description) {
        assignment.description = description;
      }

      assignment.status = "submitted";
      assignment.reviewerId = newReviewerId;
      assignment.currentReviewer = newReviewerId;

      await assignment.save();

      if (newReviewerId) {
        const student = await User.findById(req.user.id).select("name");
        await Notification.create({
          user: newReviewerId,
          message: `Assignment "${assignment.title}" has been resubmitted by ${student?.name || "a student"}`,
          relatedAssignment: assignment._id,
        });
      }

      return res.json({
        message: "Assignment resubmitted successfully"
      });
    } catch (err) {
      console.error("Resubmit Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/notifications", verifyToken, isStudent, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("relatedAssignment", "title status")
      .lean();

    return res.json({ notifications });
  } catch (err) {
    console.error("Notifications Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/notifications/:id/read", verifyToken, isStudent, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification });
  } catch (err) {
    console.error("Mark Read Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
