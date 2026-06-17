const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  favouriteSongs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
  }],
  followedArtists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
  }],
  favouriteArtists: [{
    type: String,
  }],
  playlists: [{
    name: {
      type: String,
      required: true,
    },
    songs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
    }],
  }],
  hiddenSongs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
  }],
  skipsUsed: {
    type: Number,
    default: 0,
  },
  skipsResetTime: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);