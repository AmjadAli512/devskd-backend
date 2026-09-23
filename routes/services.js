const express = require('express');
const Service = require('../models/Service');
const authMiddleware = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// ------------------------------------------------
// GET /services - Get all services for logged-in user
// ------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------------------------------------
// GET /services/stats - Get service statistics for logged-in user
// ------------------------------------------------
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [stats] = await Service.aggregate([
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
    const service = await Service.findById(req.params.id);

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
router.post('/', authMiddleware, adminOnly, async (req, res) => {
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
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
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

    const service = await Service.findByIdAndUpdate(
      req.params.id,
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
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

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
