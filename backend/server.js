const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const authRoutes = require('./routes/auth');
const houseRoutes = require('./routes/house');
const walletRoutes = require('./routes/wallet');
const billRoutes = require('./routes/bill');
app.use('/api/auth', authRoutes);
app.use('/api/house', houseRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/bill', billRoutes);

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
