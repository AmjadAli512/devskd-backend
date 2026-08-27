const express = require('express');
const Note = require('../models/Note');

const router = express.Router();

// GET all notes
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
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

// POST create note
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const note = await Note.create({ title: title.trim(), content: content.trim() });
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update note
router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const note = await Note.findByIdAndUpdate(
      req.params.id,
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

// DELETE note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
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