const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database sederhana (dalam memori)
// Untuk production, ganti dengan MongoDB
let donations = [];
let dailyDonations = [];

// Reset daily donations setiap hari
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    dailyDonations = [];
  }
}, 60000); // Check setiap menit

// Helper function untuk format donasi
function formatDonation(platform, data) {
  const donation = {
    id: Date.now() + Math.random(),
    platform: platform,
    donor_name: '',
    amount: 0,
    message: '',
    timestamp: new Date().toISOString()
  };

  // Format berdasarkan platform
  if (platform === 'saweria') {
    donation.donor_name = data.donor_name || data.donatur_name || 'Anonymous';
    donation.amount = parseInt(data.amount) || 0;
    donation.message = data.message || '';
  } else if (platform === 'sociabuzz') {
    donation.donor_name = data.supporter_name || 'Anonymous';
    donation.amount = parseInt(data.amount) || 0;
    donation.message = data.message || '';
  } else if (platform === 'trakteer') {
    donation.donor_name = data.supporter_name || 'Anonymous';
    donation.amount = parseInt(data.amount) || 0;
    donation.message = data.supporter_message || '';
  }

  return donation;
}

// Webhook endpoint untuk Saweria
app.post('/webhook/saweria', (req, res) => {
  console.log('Saweria webhook received:', req.body);
  
  const donation = formatDonation('saweria', req.body);
  donations.push(donation);
  dailyDonations.push(donation);
  
  // Keep only last 100 donations in memory
  if (donations.length > 100) {
    donations.shift();
  }
  
  res.status(200).json({ success: true, message: 'Donation recorded' });
});

// Webhook endpoint untuk Sociabuzz
app.post('/webhook/sociabuzz', (req, res) => {
  console.log('Sociabuzz webhook received:', req.body);
  
  const donation = formatDonation('sociabuzz', req.body);
  donations.push(donation);
  dailyDonations.push(donation);
  
  if (donations.length > 100) {
    donations.shift();
  }
  
  res.status(200).json({ success: true, message: 'Donation recorded' });
});

// Webhook endpoint untuk Trakteer
app.post('/webhook/trakteer', (req, res) => {
  console.log('Trakteer webhook received:', req.body);
  
  const donation = formatDonation('trakteer', req.body);
  donations.push(donation);
  dailyDonations.push(donation);
  
  if (donations.length > 100) {
    donations.shift();
  }
  
  res.status(200).json({ success: true, message: 'Donation recorded' });
});

// Endpoint untuk Roblox - Get latest donation
app.get('/api/latest', (req, res) => {
  const latest = donations[donations.length - 1];
  res.json(latest || null);
});

// Endpoint untuk Roblox - Get all time leaderboard
app.get('/api/leaderboard/alltime', (req, res) => {
  const leaderboard = {};
  
  donations.forEach(donation => {
    if (!leaderboard[donation.donor_name]) {
      leaderboard[donation.donor_name] = 0;
    }
    leaderboard[donation.donor_name] += donation.amount;
  });
  
  const sorted = Object.entries(leaderboard)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10
  
  res.json(sorted);
});

// Endpoint untuk Roblox - Get daily leaderboard
app.get('/api/leaderboard/daily', (req, res) => {
  const leaderboard = {};
  
  dailyDonations.forEach(donation => {
    if (!leaderboard[donation.donor_name]) {
      leaderboard[donation.donor_name] = 0;
    }
    leaderboard[donation.donor_name] += donation.amount;
  });
  
  const sorted = Object.entries(leaderboard)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10
  
  res.json(sorted);
});

// Endpoint untuk Roblox - Get recent donations
app.get('/api/recent', (req, res) => {
  const recent = donations.slice(-5).reverse(); // Last 5 donations
  res.json(recent);
});

// Test endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    endpoints: {
      webhooks: ['/webhook/saweria', '/webhook/sociabuzz', '/webhook/trakteer'],
      api: ['/api/latest', '/api/leaderboard/alltime', '/api/leaderboard/daily', '/api/recent']
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
