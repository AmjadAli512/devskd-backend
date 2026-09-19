const express = require('express');
const mongoose = require('mongoose');
const Service = require('../models/Service');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ------------------------------------------------
// Apply auth middleware to ALL routes below
// ------------------------------------------------
router.use(authMiddleware);

// ------------------------------------------------
// GET /services - Get all services for logged-in user
// ------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------------------------------------
// GET /services/stats - Get service statistics for logged-in user
// ------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const [stats] = await Service.aggregate([
      { $match: { userId } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          featured: [{ $match: { featured: true } }, { $count: 'count' }],
          recent: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    res.json({
      total: stats.total[0]?.count || 0,
      featured: stats.featured[0]?.count || 0,
      recent: stats.recent[0]?.count || 0
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------------------------------------
// GET /services/:id - Get a single service (owned by user)
// ------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------------------------------------
// POST /services - Create a new service for logged-in user
// ------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { title, description, shortDescription, icon, featured } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!description?.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (!shortDescription?.trim()) {
      return res.status(400).json({ error: 'Short description is required' });
    }

    const service = await Service.create({
      title: title.trim(),
      description: description.trim(),
      shortDescription: shortDescription.trim(),
      icon,
      featured,
      userId: req.userId  // attach the owner
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ------------------------------------------------
// PUT /services/:id - Update a service (owned by user)
// ------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { title, description, shortDescription, icon, featured } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!description?.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (!shortDescription?.trim()) {
      return res.status(400).json({ error: 'Short description is required' });
    }

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },  // only owner can update
      {
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim(),
        icon,
        featured
      },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(400).json({ error: error.message });
  }
});

// ------------------------------------------------
// DELETE /services/:id - Delete a service (owned by user)
// ------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId  // only owner can delete
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
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
