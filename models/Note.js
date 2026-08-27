const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    minlength: [1, 'Content must be at least 1 character'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  }
}, {
  timestamps: true  // Automatically adds createdAt & updatedAt
});

module.exports = mongoose.model('Note', noteSchema);