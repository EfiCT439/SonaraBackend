const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const multer = require('multer');
const FormData = require('form-data');

// Keep the sample in memory — it's a ~10s clip, we forward it straight on.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB ceiling
});

const HTTP_METHOD = 'POST';
const HTTP_URI = '/v1/identify';
const DATA_TYPE = 'audio';
const SIGNATURE_VERSION = '1';

// ACRCloud requires every request to be signed with the account secret.
// That secret lives here (server-side) and never ships inside the app.
function sign(accessKey, accessSecret, timestamp) {
  const stringToSign = [HTTP_METHOD, HTTP_URI, accessKey, DATA_TYPE, SIGNATURE_VERSION, timestamp].join('\n');
  return crypto.createHmac('sha1', accessSecret).update(stringToSign).digest('base64');
}

// POST /api/recognize — identify a song from an uploaded audio sample
router.post('/', upload.single('sample'), async (req, res) => {
  try {
    const host = process.env.ACR_HOST;
    const accessKey = process.env.ACR_ACCESS_KEY;
    const accessSecret = process.env.ACR_ACCESS_SECRET;

    if (!host || !accessKey || !accessSecret) {
      return res.status(500).json({
        status: 'error',
        message: 'ACRCloud is not configured. Set ACR_HOST, ACR_ACCESS_KEY and ACR_ACCESS_SECRET in .env',
      });
    }

    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No audio sample was uploaded.' });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(accessKey, accessSecret, timestamp);

    const form = new FormData();
    form.append('sample', req.file.buffer, {
      filename: req.file.originalname || 'sample.m4a',
      contentType: req.file.mimetype || 'audio/mp4',
    });
    form.append('sample_bytes', String(req.file.buffer.length));
    form.append('access_key', accessKey);
    form.append('data_type', DATA_TYPE);
    form.append('signature_version', SIGNATURE_VERSION);
    form.append('signature', signature);
    form.append('timestamp', timestamp);

    const acr = await axios.post(`https://${host}${HTTP_URI}`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });

    const code = acr.data?.status?.code;
    const music = acr.data?.metadata?.music?.[0];

    if (code === 0 && music) {
      const spotifyId = music.external_metadata?.spotify?.track?.id;
      return res.json({
        status: 'success',
        result: {
          title: music.title || 'Unknown Title',
          artist: (music.artists || []).map(a => a.name).filter(Boolean).join(', ') || 'Unknown Artist',
          album: music.album?.name || null,
          genre: (music.genres || [])[0]?.name || 'Music',
          releaseDate: music.release_date || null,
          songLink: spotifyId ? `https://open.spotify.com/track/${spotifyId}` : null,
        },
      });
    }

    // 1001 = ACRCloud understood us, but found no match.
    if (code === 1001) {
      return res.json({
        status: 'no_match',
        message: 'No match found — try again with the music playing louder',
      });
    }

    return res.json({
      status: 'error',
      message: acr.data?.status?.msg
        ? `${acr.data.status.msg} (code ${code})`
        : 'Could not identify the song. Please try again.',
    });
  } catch (err) {
    console.error('[Recognize] error:', err.response?.data || err.message);
    res.status(500).json({ status: 'error', message: 'Recognition failed. Please try again.' });
  }
});

module.exports = router;
