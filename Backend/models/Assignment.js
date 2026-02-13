const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  action: {
    type: String,
    enum: ["submitted", "approved", "rejected", "resubmitted", "forwarded"],
    required: true
  },
  remark: {
    type: String
  },
  signature: {
    type: String
  },
  oldFilePath: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const assignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String
    },

    category: {
      type: String,
      enum: ["Assignment", "Thesis", "Report"],
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    fileOriginalName: {
      type: String
    },

    fileSize: {
      type: Number
    },

    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "forwarded"],
      default: "draft"
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    currentReviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    },

    history: [historySchema]
  },
  {
    timestamps: true
  }
);

assignmentSchema.virtual('studentId').get(function() {
  return this.student;
});

module.exports = mongoose.model("Assignment", assignmentSchema);
