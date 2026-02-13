const mongoose = require('mongoose');


const DepartmentSchema = new mongoose.Schema({
name: { type: String, required: true, trim: true },
type: { type: String, enum: ['UG', 'PG', 'Research'], required: true },
address: { type: String, required: true, trim: true },
}, { timestamps: true });


module.exports = mongoose.model('Department', DepartmentSchema);