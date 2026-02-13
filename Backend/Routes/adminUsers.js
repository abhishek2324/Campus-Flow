const express = require("express");
const path = require("path");
const router = express.Router();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Department = require("../models/Department");

router.post("/users/create", async (req, res) => {
  try {
    const { name, email, password, phone, departmentId, role, status } = req.body;

    if (!name || !email || !phone || !departmentId || !role) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    let plainPassword = password;
    if (!plainPassword) {
      plainPassword = Math.random().toString(36).slice(-8);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: role.toLowerCase(),
      departmentId,
      status: status || "Active",
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        department: newUser.department,
      },
      defaultPassword: plainPassword,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    let { page = 1, limit = 20, role, departmentId, search } = req.query;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 20;

    const andConditions = [];

    if (role && ["Student", "Professor", "HOD", "student", "professor", "hod"].includes(role)) {
      andConditions.push({ role: role.toLowerCase() });
    }

    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      const deptId = new mongoose.Types.ObjectId(departmentId);
      andConditions.push({
        $or: [{ departmentId: deptId }, { department: deptId }],
      });
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      andConditions.push({ $or: [{ name: regex }, { email: regex }] });
    }

    const match = andConditions.length > 0 ? { $and: andConditions } : {};

    const pipeline = [
      { $match: match },
      {
        $addFields: {
          _deptRef: { $ifNull: ["$departmentId", "$department"] },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_deptRef",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
      { $project: { _deptRef: 0 } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                password: 0,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await User.aggregate(pipeline);
    const users = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      users,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/users/new", (req, res) => {
  const distPath = path.join(__dirname, "../../Frontend/Assignment-uploader/dist");
  res.sendFile(path.join(distPath, "index.html"));
});

router.get("/users/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id)
      .populate("departmentId", "name")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    delete user.password;

    const departments = await Department.find({}, "_id name").lean();

    return res.json({
      user,
      departments,
    });
  } catch (err) {
    console.error("Error fetching user for edit:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/users/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, departmentId, password, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!name || !email || !phone || !departmentId) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingWithEmail = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: id },
    });

    if (existingWithEmail) {
      return res
        .status(409)
        .json({ message: "Email is already in use by another user" });
    }

    user.name = name;
    user.email = email.toLowerCase();
    user.phone = phone;
    user.departmentId = departmentId;

    if (status) {
      user.status = status;
    }

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      user.password = hashedPassword;
    }

    await user.save();

    const updatedUser = await User.findById(id)
      .populate("departmentId", "name")
      .select("-password")
      .lean();

    return res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
