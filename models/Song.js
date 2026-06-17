 const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true,
  },
  album: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    required: true,
  },
  audioUrl: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '',
  },
  lyrics: {
    type: String,
    default: '',
  },
  genre: {
    type: String,
    required: true,
  },
  plays: {
    type: Number,
    default: 0,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Song', songSchema);
