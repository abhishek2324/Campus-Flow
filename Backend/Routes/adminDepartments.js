const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');




router.get('/admin/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const dept = await Department.findById(id).lean();
    if (!dept) return res.status(404).json({ ok: false, message: 'Department not found' });

    const usersCount = await User.countDocuments({
      $or: [{ department: id }, { departmentId: id }],
    });

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    return res.json({ ok: true, department: { ...dept, usersCount } });
  } catch (err) {
    console.error('Error getting department', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});


router.post('/admin/departments', async (req, res) => {
  try {
    const { name, type, address } = req.body;
    const errors = [];
    if (!name || !name.trim()) errors.push({ field: 'name', msg: 'Department name is required' });
    if (!type || !['UG', 'PG', 'Research'].includes(type)) errors.push({ field: 'type', msg: 'Program type must be UG, PG, or Research' });
    if (!address || !address.trim()) errors.push({ field: 'address', msg: 'Address is required' });

    if (errors.length) return res.status(400).json({ ok: false, errors });

    const dept = new Department({ name: name.trim(), type, address: address.trim() });
    await dept.save();
    return res.status(201).json({ ok: true, department: dept });
  } catch (err) {
    console.error('Error creating department', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

router.get('/admin/departments', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
    const search = (req.query.search || '').trim();
    const type = (req.query.type || '').trim();

    const match = {};
    if (search) {
      match.name = { $regex: search, $options: 'i' };
    }
    if (type && type !== 'All') {
      match.type = type;
    }

    const total = await Department.countDocuments(match);

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          let: { deptId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$departmentId', '$$deptId'] },
                    { $eq: ['$department', '$$deptId'] },
                  ],
                },
              },
            },
          ],
          as: 'users',
        },
      },
      {
        $addFields: {
          usersCount: { $size: '$users' }
        }
      },
      {
        $project: {
          users: 0
        }
      },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const departments = await Department.aggregate(pipeline);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({ ok: true, departments, page, totalPages, total });
  } catch (err) {
    console.error('Error fetching departments', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

router.put('/admin/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const { name, type, address } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name && name.trim();
    if (type !== undefined) updates.type = type;
    if (address !== undefined) updates.address = address && address.trim();

    const errors = [];
    if (updates.name === '' || !updates.name) errors.push({ field: 'name', msg: 'Department name is required' });
    if (updates.type && !['UG', 'PG', 'Research'].includes(updates.type)) errors.push({ field: 'type', msg: 'Invalid type' });
    if (updates.address === '' || !updates.address) errors.push({ field: 'address', msg: 'Address is required' });

    if (errors.length) return res.status(400).json({ ok: false, errors });

    const dept = await Department.findByIdAndUpdate(id, updates, { new: true });
    if (!dept) return res.status(404).json({ ok: false, message: 'Department not found' });

    return res.json({ ok: true, department: dept });
  } catch (err) {
    console.error('Error updating department', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

router.delete('/admin/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'Invalid department id' });
    }

    const usersCount = await User.countDocuments({
      $or: [{ department: id }, { departmentId: id }],
    });

    if (usersCount > 0) {
      return res.status(400).json({
        ok: false,
        message: 'Department has assigned users and cannot be deleted',
        usersCount
      });
    }

    const deleted = await Department.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ ok: false, message: 'Department not found' });

    return res.json({ ok: true, message: 'Department deleted' });
  } catch (err) {
    console.error('Error deleting department', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
