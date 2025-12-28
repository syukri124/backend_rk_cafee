require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require("./models");

// Set timezone to Indonesia (WIB)
process.env.TZ = 'Asia/Jakarta';

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
    'https://rk-cafe.up.railway.app', // Frontend Railway
    'http://localhost:8080', // Development
    'http://localhost:3000', // Development alternative
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Serve static files untuk gambar
app.use('/uploads', express.static('uploads'));

// Daftarkan semua routes
app.use('/api', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);
app.use('/api', bahanRoutes);
app.use('/api', bomRoutes);
app.use('/api', riwayatStokRoutes);
app.use('/api', laporanRoutes);

// Default Route
app.get('/', (req, res) => {
  res.json({ message: "RKCafee Backend is Running!" });
});

// Sync database
db.sequelize
  .sync({ alter: true })
  .then(() => console.log("Database connected & synchronized"))
  .catch((err) => console.error("DB Sync Error:", err));

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
