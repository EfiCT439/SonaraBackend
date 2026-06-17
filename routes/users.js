const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create user profile
router.post('/create', async (req, res) => {
  try {
    const { firebaseUid, name, email, favouriteArtists } = req.body;
    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) return res.json(existingUser);
    const user = new User({ firebaseUid, name, email, favouriteArtists });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user profile
router.get('/:firebaseUid', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid })
      .populate('favouriteSongs')
      .populate('followedArtists');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add song to favourites
router.post('/:firebaseUid/favourite/:songId', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.favouriteSongs.includes(req.params.songId)) {
      user.favouriteSongs.push(req.params.songId);
      await user.save();
    }
    res.json({ message: 'Song added to favourites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove song from favourites
router.delete('/:firebaseUid/favourite/:songId', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.favouriteSongs = user.favouriteSongs.filter(
      id => id.toString() !== req.params.songId
    );
    await user.save();
    res.json({ message: 'Song removed from favourites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hide song
router.post('/:firebaseUid/hide/:songId', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.hiddenSongs.includes(req.params.songId)) {
      user.hiddenSongs.push(req.params.songId);
      await user.save();
    }
    res.json({ message: 'Song hidden successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create playlist (Premium only)
router.post('/:firebaseUid/playlist', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isPremium) return res.status(403).json({ message: 'Premium required' });
    user.playlists.push({ name: req.body.name, songs: [] });
    await user.save();
    res.json({ message: 'Playlist created successfully', playlists: user.playlists });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Follow artist
router.post('/:firebaseUid/follow/:artistId', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.followedArtists.includes(req.params.artistId)) {
      user.followedArtists.push(req.params.artistId);
      await user.save();
    }
    res.json({ message: 'Artist followed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;