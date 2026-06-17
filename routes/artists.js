 const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');

// Get all artists
router.get('/', async (req, res) => {
  try {
    const artists = await Artist.find();
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single artist
router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id).populate('songs');
    if (!artist) return res.status(404).json({ message: 'Artist not found' });
    res.json(artist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Follow artist
router.post('/:id/follow', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ message: 'Artist not found' });
    artist.followers += 1;
    await artist.save();
    res.json({ message: 'Artist followed successfully', followers: artist.followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unfollow artist
router.post('/:id/unfollow', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ message: 'Artist not found' });
    artist.followers -= 1;
    await artist.save();
    res.json({ message: 'Artist unfollowed successfully', followers: artist.followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
