const express = require('express');
const Note = require('../models/Note');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ------------------------------------------------
// Apply auth middleware to ALL routes below
// ------------------------------------------------
router.use(authMiddleware);

// ------------------------------------------------
// GET /notes - Get all notes for logged-in user
// ------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------------------------------------
// GET /notes/:id - Get a single note (owned by user)
// ------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------------------------------------
// POST /notes - Create a new note for logged-in user
// ------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const note = await Note.create({
      title: title.trim(),
      content: content.trim(),
      userId: req.userId  // 🔑 attach the owner
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ------------------------------------------------
// PUT /notes/:id - Update a note (owned by user)
// ------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },  // 🔑 only owner can update
      { title: title.trim(), content: content.trim() },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(400).json({ error: error.message });
  }
});

// ------------------------------------------------
// DELETE /notes/:id - Delete a note (owned by user)
// ------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId  // 🔑 only owner can delete
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(204).send();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;