const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

function isHod(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "hod")
    return res.status(403).json({ message: "Forbidden - HOD only" });
  next();
}

router.get("/dashboard", verifyToken, isHod, async (req, res) => {
  try {
    const hodId = req.user.id;
    const pendingAssignments = await Assignment.find({
      status: "forwarded",
      currentReviewer: hodId,
    })
      .populate("student", "name email")
      .sort({ createdAt: 1 })
      .lean();

    const assignmentsWithDays = pendingAssignments.map((a) => {
      const daysPending = Math.floor(
        (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...a, daysPending };
    });

    return res.json({
      pendingCount: pendingAssignments.length,
      assignments: assignmentsWithDays,
    });
  } catch (err) {
    console.error("HOD Dashboard Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/assignments/:id/review", verifyToken, isHod, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("student", "name email")
      .populate("history.reviewerId", "name email")
      .lean();

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.currentReviewer?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ assignment });
  } catch (err) {
    console.error("HOD Review Fetch Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/assignments/:id/approve", verifyToken, isHod, async (req, res) => {
  try {
    const { remark = "", signature = "" } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.currentReviewer?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (assignment.status !== "forwarded") {
      return res.status(400).json({
        message: "Only forwarded assignments can be finally approved",
      });
    }

    assignment.status = "approved";
    assignment.currentReviewer = undefined;
    assignment.history = assignment.history || [];
    assignment.history.push({
      reviewerId: req.user.id,
      action: "approved",
      remark: remark || "Final approval by HOD",
      signature: signature ? crypto.createHash("sha256").update(signature).digest("hex") : "",
      date: new Date(),
    });

    await assignment.save();

    const hod = await User.findById(req.user.id).select("name");
    await Notification.create({
      user: assignment.student,
      message: `Your assignment "${assignment.title}" has been finally approved by ${hod?.name || "HOD"}`,
      relatedAssignment: assignment._id,
    });

    return res.json({ message: "Assignment finally approved" });
  } catch (err) {
    console.error("HOD Approve Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/assignments/:id/reject", verifyToken, isHod, async (req, res) => {
  try {
    const { remark = "" } = req.body;
    const trimmedRemark = remark.trim();

    if (!trimmedRemark) {
      return res.status(400).json({ message: "Rejection feedback is required" });
    }

    if (trimmedRemark.length < 10) {
      return res.status(400).json({
        message: "Feedback must be at least 10 characters",
      });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.currentReviewer?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (assignment.status !== "forwarded") {
      return res.status(400).json({
        message: "Only forwarded assignments can be rejected",
      });
    }

    assignment.status = "rejected";
    assignment.reviewerId = undefined;
    assignment.currentReviewer = undefined;
    assignment.history = assignment.history || [];
    assignment.history.push({
      reviewerId: req.user.id,
      action: "rejected",
      remark: trimmedRemark,
      date: new Date(),
    });

    await assignment.save();

    const hod = await User.findById(req.user.id).select("name");
    await Notification.create({
      user: assignment.student,
      message: `Your assignment "${assignment.title}" has been rejected by ${hod?.name || "HOD"}. Feedback: ${trimmedRemark}`,
      relatedAssignment: assignment._id,
    });

    return res.json({ message: "Assignment rejected" });
  } catch (err) {
    console.error("HOD Reject Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
