require('dotenv').config();
const mongoose = require('mongoose');
const Artist = require('./models/Artist');
const Song = require('./models/Song');

const ARTISTS = [
  { name: 'Burna Boy', genre: 'Afrobeats', bio: 'Grammy-winning Nigerian artist known as the African Giant.', image: '', followers: 12500000 },
  { name: 'Wizkid', genre: 'Afrobeats', bio: 'Star Boy — one of Africa\'s biggest global exports.', image: '', followers: 11000000 },
  { name: 'Davido', genre: 'Afrobeats', bio: 'OBO — Nigerian superstar with an unstoppable catalog.', image: '', followers: 10000000 },
  { name: 'Ayra Starr', genre: 'Afrobeats', bio: 'Mavin Records artist redefining Afropop for a new generation.', image: '', followers: 4500000 },
  { name: 'Asake', genre: 'Afrobeats', bio: 'Mr. Money — the hitmaker from Yoruba Street.', image: '', followers: 5000000 },
  { name: 'Fireboy DML', genre: 'Afrobeats', bio: 'YBNL artist known for his melodic Afrofusion sound.', image: '', followers: 3800000 },
  { name: 'Fave', genre: 'Afrobeats', bio: 'Afrobeats singer-songwriter with a deeply personal style.', image: '', followers: 1200000 },
  { name: 'Amaarae', genre: 'Pop', bio: 'Ghanaian-American artist blending Afropop with alt-R&B.', image: '', followers: 2000000 },
  { name: 'Stanley Enow', genre: 'Hip Hop', bio: 'King Kong — Cameroon\'s hip hop icon.', image: '', followers: 800000 },
  { name: 'Locko', genre: 'R&B', bio: 'Cameroonian R&B artist with a silky smooth voice.', image: '', followers: 600000 },
  { name: 'Charlotte Dipanda', genre: 'Soul', bio: 'Cameroonian soul queen with powerhouse vocals.', image: '', followers: 500000 },
  { name: 'Daphne', genre: 'Afrobeats', bio: 'Cameroonian Afropop star known for infectious energy.', image: '', followers: 700000 },
  { name: 'Tasha Cobbs', genre: 'Gospel', bio: 'Award-winning gospel artist whose music moves millions.', image: '', followers: 3000000 },
  { name: 'DBN Gogo', genre: 'Amapiano', bio: 'Amapiano DJ and producer from South Africa.', image: '', followers: 2200000 },
];

const AUDIO_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
];

function audioUrl(i) {
  return AUDIO_URLS[i % AUDIO_URLS.length];
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  await Song.deleteMany({});
  await Artist.deleteMany({});
  console.log('Cleared existing songs and artists.');

  const createdArtists = await Artist.insertMany(ARTISTS);
  console.log(`Inserted ${createdArtists.length} artists.`);

  const findArtist = (name) => createdArtists.find((a) => a.name === name);

  const SONGS = [
    { title: 'Last Last', artist: findArtist('Burna Boy')._id, album: 'Love, Damini', duration: 240, audioUrl: audioUrl(0), genre: 'Afrobeats', isPremium: false },
    { title: 'Ye', artist: findArtist('Burna Boy')._id, album: 'Outside', duration: 215, audioUrl: audioUrl(1), genre: 'Afrobeats', isPremium: false },
    { title: 'Love Damini', artist: findArtist('Burna Boy')._id, album: 'Love, Damini', duration: 260, audioUrl: audioUrl(2), genre: 'Afrobeats', isPremium: true },
    { title: 'Essence', artist: findArtist('Wizkid')._id, album: 'Made in Lagos', duration: 236, audioUrl: audioUrl(3), genre: 'Afrobeats', isPremium: false },
    { title: 'Come Closer', artist: findArtist('Wizkid')._id, album: 'Sounds From The Other Side', duration: 218, audioUrl: audioUrl(4), genre: 'Afrobeats', isPremium: false },
    { title: 'Ojuelegba', artist: findArtist('Wizkid')._id, album: 'Ayo', duration: 247, audioUrl: audioUrl(5), genre: 'Afrobeats', isPremium: true },
    { title: 'Fall', artist: findArtist('Davido')._id, album: 'A Good Time', duration: 231, audioUrl: audioUrl(6), genre: 'Afrobeats', isPremium: false },
    { title: 'If', artist: findArtist('Davido')._id, album: 'The Baddest', duration: 204, audioUrl: audioUrl(0), genre: 'Afrobeats', isPremium: false },
    { title: 'Away', artist: findArtist('Davido')._id, album: 'A Better Time', duration: 220, audioUrl: audioUrl(1), genre: 'Afrobeats', isPremium: true },
    { title: 'Bloody Samaritan', artist: findArtist('Ayra Starr')._id, album: '19 & Dangerous', duration: 185, audioUrl: audioUrl(2), genre: 'Afrobeats', isPremium: false },
    { title: 'Rush', artist: findArtist('Ayra Starr')._id, album: 'The Year I Turned 21', duration: 195, audioUrl: audioUrl(3), genre: 'Afrobeats', isPremium: false },
    { title: 'Sability', artist: findArtist('Ayra Starr')._id, album: '19 & Dangerous', duration: 200, audioUrl: audioUrl(4), genre: 'Afrobeats', isPremium: true },
    { title: 'Joha', artist: findArtist('Asake')._id, album: 'Work of Art', duration: 210, audioUrl: audioUrl(5), genre: 'Afrobeats', isPremium: false },
    { title: 'Terminator', artist: findArtist('Asake')._id, album: 'Mr. Money With The Vibe', duration: 225, audioUrl: audioUrl(6), genre: 'Afrobeats', isPremium: false },
    { title: 'Palazzo', artist: findArtist('Asake')._id, album: 'Work of Art', duration: 232, audioUrl: audioUrl(0), genre: 'Afrobeats', isPremium: true },
    { title: 'Peru', artist: findArtist('Fireboy DML')._id, album: 'Playboy', duration: 208, audioUrl: audioUrl(1), genre: 'Afrobeats', isPremium: false },
    { title: 'Jealous', artist: findArtist('Fireboy DML')._id, album: 'Laughter, Tears & Goosebumps', duration: 196, audioUrl: audioUrl(2), genre: 'Afrobeats', isPremium: false },
    { title: 'Baby Say', artist: findArtist('Fave')._id, album: 'Riddim', duration: 188, audioUrl: audioUrl(3), genre: 'Afrobeats', isPremium: false },
    { title: 'Beautifully Done', artist: findArtist('Amaarae')._id, album: 'The Angel You Don\'t Know', duration: 212, audioUrl: audioUrl(4), genre: 'Pop', isPremium: false },
    { title: 'SAD GIRLZ LUV MONEY', artist: findArtist('Amaarae')._id, album: 'The Angel You Don\'t Know', duration: 198, audioUrl: audioUrl(5), genre: 'Pop', isPremium: true },
    { title: 'King Kong', artist: findArtist('Stanley Enow')._id, album: 'Soldier of the Soil', duration: 250, audioUrl: audioUrl(6), genre: 'Hip Hop', isPremium: false },
    { title: 'Your Waist', artist: findArtist('Stanley Enow')._id, album: 'Njanga et Plantain', duration: 235, audioUrl: audioUrl(0), genre: 'Hip Hop', isPremium: false },
    { title: 'Nayo', artist: findArtist('Locko')._id, album: 'Nayo', duration: 222, audioUrl: audioUrl(1), genre: 'R&B', isPremium: false },
    { title: 'Amour dans la ville', artist: findArtist('Locko')._id, album: 'Locko', duration: 215, audioUrl: audioUrl(2), genre: 'R&B', isPremium: false },
    { title: 'Ayo', artist: findArtist('Charlotte Dipanda')._id, album: 'Nguema Na Mba', duration: 265, audioUrl: audioUrl(3), genre: 'Soul', isPremium: false },
    { title: 'Mama', artist: findArtist('Charlotte Dipanda')._id, album: 'L\'Inattendue', duration: 280, audioUrl: audioUrl(4), genre: 'Soul', isPremium: true },
    { title: 'Njama Njama', artist: findArtist('Daphne')._id, album: 'Daphne', duration: 205, audioUrl: audioUrl(5), genre: 'Afrobeats', isPremium: false },
    { title: 'No Stress', artist: findArtist('Daphne')._id, album: 'No Stress', duration: 198, audioUrl: audioUrl(6), genre: 'Afrobeats', isPremium: false },
    { title: 'For Your Glory', artist: findArtist('Tasha Cobbs')._id, album: 'Grace', duration: 320, audioUrl: audioUrl(0), genre: 'Gospel', isPremium: false },
    { title: 'Break Every Chain', artist: findArtist('Tasha Cobbs')._id, album: 'Grace', duration: 290, audioUrl: audioUrl(1), genre: 'Gospel', isPremium: false },
    { title: 'Possible', artist: findArtist('DBN Gogo')._id, album: 'Mix Sessions', duration: 360, audioUrl: audioUrl(2), genre: 'Amapiano', isPremium: false },
    { title: 'Uptownship', artist: findArtist('DBN Gogo')._id, album: 'Uptownship', duration: 340, audioUrl: audioUrl(3), genre: 'Amapiano', isPremium: true },
  ];

  const createdSongs = await Song.insertMany(SONGS);
  console.log(`Inserted ${createdSongs.length} songs.`);

  // Link songs back to their artists
  for (const song of createdSongs) {
    await Artist.findByIdAndUpdate(song.artist, { $push: { songs: song._id } });
  }
  console.log('Linked songs to artists.');

  console.log('✅ Database seeded successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
