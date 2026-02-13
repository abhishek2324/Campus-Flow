const Assignment = require("../models/Assignment");

/**
 * USER STORY 1
 * Student Dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    const stats = await Assignment.aggregate([
      { $match: { studentId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const recentAssignments = await Assignment.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      stats,
      recentAssignments
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard fetch failed" });
  }
};

/**
 * USER STORY 2
 * Upload Assignment (Single)
 */
exports.uploadAssignment = async (req, res) => {
  try {
    const { title, description, category, departmentId } = req.body;

    const assignment = await Assignment.create({
      studentId: req.user.id,
      title,
      description,
      category,
      departmentId,
      filePath: req.file.path,
      status: "draft"
    });

    res.status(201).json({
      message: "Assignment uploaded successfully",
      assignmentId: assignment._id
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed" });
  }
};

/**
 * USER STORY 3
 * Bulk Upload Assignments
 */
exports.bulkUploadAssignments = async (req, res) => {
  try {
    const { description, category, departmentId } = req.body;

    const assignments = req.files.map(file => ({
      studentId: req.user.id,
      title: file.originalname,
      description,
      category,
      departmentId,
      filePath: file.path,
      status: "draft"
    }));

    const savedAssignments = await Assignment.insertMany(assignments);

    res.status(201).json({
      message: "Bulk upload successful",
      assignments: savedAssignments
    });
  } catch (error) {
    res.status(500).json({ message: "Bulk upload failed" });
  }
};

/**
 * USER STORY 4
 * View All Assignments
 */
exports.getMyAssignments = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { studentId: req.user.id };
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate("reviewerId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};
