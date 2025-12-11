require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Routes
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const bahanRoutes = require('./routes/bahanRoutes');
const bomRoutes = require('./routes/bomRoutes');
const riwayatStokRoutes = require('./routes/riwayatStokRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Daftarkan semua routes
app.use('/api', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);
app.use('/api', bahanRoutes);
app.use('/api', bomRoutes);
app.use('/api', riwayatStokRoutes);

// Default Route
app.get('/', (req, res) => {
    res.json({ message: "RKCafee Backend running" });
});

// Jalankan server hanya jika sedang di LOCALHOST
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}
