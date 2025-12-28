const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Store: { peerId: { addresses, username, lastSeen } }
const peers = new Map();
const TIMEOUT = 60000; // 60s offline = remove

// Cleanup old peers
setInterval(() => {
  const now = Date.now();
  for (const [id, p] of peers) {
    if (now - p.lastSeen > TIMEOUT) peers.delete(id);
  }
}, 30000);

// Register/update peer
app.post('/peer', (req, res) => {
  const { peerId, addresses, username } = req.body;
  if (!peerId) return res.status(400).json({ error: 'peerId required' });
  peers.set(peerId, { addresses: addresses || [], username, lastSeen: Date.now() });
  res.json({ ok: true, count: peers.size });
});

// Get all online peers
app.get('/peers', (req, res) => {
  const list = [];
  for (const [peerId, p] of peers) {
    list.push({ peerId, addresses: p.addresses, username: p.username });
  }
  res.json(list);
});

// Search by username
app.get('/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const results = [];
  for (const [peerId, p] of peers) {
    if (p.username && p.username.toLowerCase().includes(q)) {
      results.push({ peerId, addresses: p.addresses, username: p.username });
    }
  }
  res.json(results);
});

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', peers: peers.size }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Signaling server on port ${PORT}`));
