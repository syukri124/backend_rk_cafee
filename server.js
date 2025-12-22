require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require("./models");

// Routes
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const bahanRoutes = require('./routes/bahanRoutes');
const bomRoutes = require('./routes/bomRoutes');
const riwayatStokRoutes = require('./routes/riwayatStokRoutes');
const laporanRoutes = require('./routes/laporanRoutes');

const app = express();

// Konfigurasi CORS untuk Railway production
const corsOptions = {
  origin: [
    'https://frontendrkcafee-production.up.railway.app', // Frontend Railway
    'http://localhost:8080', // Development
    'http://localhost:3000', // Development alternative
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Daftarkan semua routes
app.use('/api', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);
app.use('/api', bahanRoutes);
app.use('/api', bomRoutes);
app.use('/api', riwayatStokRoutes);
app.use('/api', laporanRoutes);

// Sync database
db.sequelize
  .sync({ alter: false })
  .then(() => console.log("Database connected & synchronized"))
  .catch((err) => console.error("DB Sync Error:", err));

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
