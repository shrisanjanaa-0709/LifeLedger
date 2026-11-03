const cron = require('node-cron');
const { runWarrantyReminderCheck } = require('./utils/warrantyReminder');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const routes = require('./routes/api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow frontend requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Create upload folder
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Serve uploaded invoices
app.use('/uploads', express.static(uploadPath));

// API routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);

// Serve React frontend
app.use(express.static(path.join(__dirname, 'client', 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Connect MongoDB and start server
mongoose.connect(process.env.MONGO_DB_URI)
  .then(() => {
    console.log('Database connected successfully');

    // Check warranty expiry every day at 9:00 AM
    cron.schedule('0 9 * * *', () => {
      console.log('Starting daily warranty reminder check...');
      runWarrantyReminderCheck();
    });

    console.log('Daily warranty email scheduler started');

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });
