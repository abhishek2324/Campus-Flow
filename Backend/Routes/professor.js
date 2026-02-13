const express = require("express");
const router = express.Router();
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const Assignment = require("../models/Assignment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { verifyToken, isProfessor, authorizeRoles } = require("../middleware/auth");

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.get("/dashboard", verifyToken, isProfessor, async (req, res) => {
  try {
    const professorId = req.user.id;

    const pendingAssignments = await Assignment.find({
      status: { $in: ["submitted", "forwarded"] },
      $or: [
        { currentReviewer: professorId },
        { reviewerId: professorId }
      ]
    })
      .populate("student", "name email")
      .sort({ createdAt: 1 });

    const assignmentsWithDays = pendingAssignments.map(a => {
      const daysPending = Math.floor(
        (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...a.toObject(),
        daysPending
      };
    });

    return res.json({
      pendingCount: pendingAssignments.length,
      assignments: assignmentsWithDays
    });
  } catch (err) {
    console.error("Professor Dashboard Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/notifications", verifyToken, isProfessor, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("relatedAssignment", "title status")
      .lean();

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("Notifications Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/notifications/:id/read", verifyToken, isProfessor, async (req, res) => {
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

router.get(
  "/assignments/:id/review",
  verifyToken,
  isProfessor,
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id)
        .populate("student", "name email")
        .populate("history.reviewerId", "name email");

      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });

      if (
        assignment.currentReviewer?.toString() !== req.user.id &&
        assignment.reviewerId?.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      return res.json({ assignment });
    } catch (err) {
      console.error("Review Fetch Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
  "/assignments/:id/send-otp",
  verifyToken,
  isProfessor,
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });

      if (
        assignment.currentReviewer?.toString() !== req.user.id &&
        assignment.reviewerId?.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (assignment.status !== "submitted" && assignment.status !== "forwarded") {
        return res
          .status(400)
          .json({ message: "Only submitted assignments can be approved" });
      }

      // Get professor email
      const professor = await User.findById(req.user.id).select("email name");
      if (!professor || !professor.email) {
        return res.status(400).json({ message: "Professor email not found" });
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      otpStore.set(`${req.params.id}_${req.user.id}`, {
        otp,
        expiresAt,
      });

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: professor.email,
            subject: "Assignment Approval OTP",
            html: `
              <h2>Assignment Approval Verification</h2>
              <p>Dear ${professor.name},</p>
              <p>Your OTP for approving assignment "<strong>${assignment.title}</strong>" is:</p>
              <h1 style="color: #4F46E5; font-size: 32px;">${otp}</h1>
              <p>This OTP is valid for 10 minutes.</p>
              <p>If you did not request this, please ignore this email.</p>
            `,
          });
        } catch (emailErr) {
          console.error("Email send error:", emailErr);
        }
      }

      return res.json({
        message: "OTP sent to your email",
        ...(process.env.NODE_ENV !== "production" && { devOtp: otp }),
      });
    } catch (err) {
      console.error("Send OTP Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
  "/assignments/:id/approve",
  verifyToken,
  isProfessor,
  async (req, res) => {
    try {
      const { remark = "", signature = "", otp, skipOtp = false } = req.body;

      const assignment = await Assignment.findById(req.params.id);
      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });

      if (
        assignment.currentReviewer?.toString() !== req.user.id &&
        assignment.reviewerId?.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (assignment.status !== "submitted" && assignment.status !== "forwarded") {
        return res
          .status(400)
          .json({ message: "Only submitted assignments can be approved" });
      }

      if (!skipOtp) {
        const storedOtp = otpStore.get(`${req.params.id}_${req.user.id}`);
        
        if (!storedOtp) {
          return res.status(400).json({ message: "OTP not found. Please request a new OTP." });
        }

        if (Date.now() > storedOtp.expiresAt) {
          otpStore.delete(`${req.params.id}_${req.user.id}`);
          return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
        }

        if (storedOtp.otp !== otp) {
          return res.status(400).json({ message: "Invalid OTP" });
        }

        otpStore.delete(`${req.params.id}_${req.user.id}`);
      }

      const signatureHash = signature
        ? crypto.createHash("sha256").update(signature).digest("hex")
        : "";

      assignment.status = "approved";

      assignment.history = assignment.history || [];
      assignment.history.push({
        reviewerId: req.user.id,
        action: "approved",
        remark,
        signature: signatureHash,
        date: new Date()
      });

      await assignment.save();

      const professor = await User.findById(req.user.id).select("name");
      await Notification.create({
        user: assignment.student,
        message: `Your assignment "${assignment.title}" has been approved by ${professor?.name || "your professor"}`,
        relatedAssignment: assignment._id
      });

      return res.json({
        message: "Assignment approved successfully"
      });
    } catch (err) {
      console.error("Approve Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
  "/assignments/:id/reject",
  verifyToken,
  isProfessor,
  async (req, res) => {
    try {
      const { remark = "" } = req.body;
      const trimmedRemark = remark.trim();

      if (!trimmedRemark) {
        return res.status(400).json({ message: "Rejection feedback is required" });
      }

      if (trimmedRemark.length < 10) {
        return res
          .status(400)
          .json({ message: "Feedback must be at least 10 characters" });
      }

      const assignment = await Assignment.findById(req.params.id);
      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });

      if (
        assignment.currentReviewer?.toString() !== req.user.id &&
        assignment.reviewerId?.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (assignment.status !== "submitted" && assignment.status !== "forwarded") {
        return res
          .status(400)
          .json({ message: "Only submitted assignments can be rejected" });
      }

      const professor = await User.findById(req.user.id).select("name email");

      assignment.status = "rejected";
      assignment.reviewerId = undefined;
      assignment.currentReviewer = undefined;

      assignment.history = assignment.history || [];
      assignment.history.push({
        reviewerId: req.user.id,
        action: "rejected",
        remark: trimmedRemark,
        date: new Date()
      });

      await assignment.save();

      await Notification.create({
        user: assignment.student,
        message: `Your assignment "${assignment.title}" has been rejected. Feedback: ${trimmedRemark}`,
        relatedAssignment: assignment._id
      });

      const student = await User.findById(assignment.student).select("email name");
      if (student?.email && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: student.email,
            subject: `Assignment Rejected: ${assignment.title}`,
            html: `
              <h2>Assignment Rejected</h2>
              <p>Dear ${student.name},</p>
              <p>Your assignment "<strong>${assignment.title}</strong>" has been rejected by ${professor?.name || "your professor"}.</p>
              <h3>Feedback:</h3>
              <p>${trimmedRemark}</p>
              <p>Please review the feedback and resubmit your assignment.</p>
            `,
          });
        } catch (emailErr) {
          console.error("Rejection email send error:", emailErr);
        }
      }

      return res.json({
        message: "Assignment rejected"
      });
    } catch (err) {
      console.error("Reject Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/colleagues",
  verifyToken,
  isProfessor,
  async (req, res) => {
    try {
      const currentUser = await User.findById(req.user.id).select("departmentId");
      const departmentId = currentUser?.departmentId;

      if (!departmentId) {
        return res.json({ colleagues: [] });
      }

      const colleagues = await User.find({
        _id: { $ne: req.user.id },
        role: { $in: ["professor", "hod"] },
        departmentId: departmentId
      })
        .select("_id name email role departmentId")
        .populate("departmentId", "name")
        .lean();

      return res.json({ colleagues });
    } catch (err) {
      console.error("Colleagues Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

const canReview = authorizeRoles("professor", "hod");

router.post(
  "/assignments/:id/forward",
  verifyToken,
  canReview,
  async (req, res) => {
    try {
      const { recipientId, note = "" } = req.body;

      if (!recipientId) {
        return res.status(400).json({ message: "Recipient is required" });
      }

      const assignment = await Assignment.findById(req.params.id);
      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });

      if (
        assignment.currentReviewer?.toString() !== req.user.id &&
        assignment.reviewerId?.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (assignment.status !== "submitted" && assignment.status !== "forwarded") {
        return res
          .status(400)
          .json({ message: "Only submitted assignments can be forwarded" });
      }

      const currentUser = await User.findById(req.user.id).select("departmentId");
      const recipient = await User.findById(recipientId).select("role departmentId name");
      
      if (!recipient || !["professor", "hod"].includes(recipient.role)) {
        return res.status(400).json({ message: "Recipient must be a professor or HOD" });
      }

      if (
        currentUser?.departmentId &&
        recipient.departmentId &&
        currentUser.departmentId.toString() !== recipient.departmentId.toString()
      ) {
        return res.status(400).json({ message: "Recipient must be in the same department" });
      }

      const previousReviewerId = req.user.id;
      const previousReviewer = await User.findById(previousReviewerId).select("name");

      assignment.status = "forwarded";
      assignment.reviewerId = recipientId;
      assignment.currentReviewer = recipientId;

      assignment.history = assignment.history || [];
      assignment.history.push({
        reviewerId: previousReviewerId,
        action: "forwarded",
        remark: note || `Forwarded to ${recipient.name}`,
        date: new Date()
      });

      await assignment.save();

      await Notification.create({
        user: recipientId,
        message: `Assignment "${assignment.title}" has been forwarded to you by ${previousReviewer?.name || "a colleague"} for review`,
        relatedAssignment: assignment._id
      });

      return res.json({
        message: "Assignment forwarded successfully"
      });
    } catch (err) {
      console.error("Forward Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
