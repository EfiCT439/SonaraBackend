const express = require('express');
const router = express.Router();
const Song = require('../models/Song');

// Get all songs
router.get('/', async (req, res) => {
  try {
    const songs = await Song.find().populate('artist');
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single song
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate('artist');
    if (!song) return res.status(404).json({ message: 'Song not found' });
    song.plays += 1;
    await song.save();
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get songs by genre
router.get('/genre/:genre', async (req, res) => {
  try {
    const songs = await Song.find({ genre: req.params.genre }).populate('artist');
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search songs
router.get('/search/:query', async (req, res) => {
  try {
    const songs = await Song.find({
      title: { $regex: req.params.query, $options: 'i' }
    }).populate('artist');
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;