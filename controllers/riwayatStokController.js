const { RiwayatStok, BahanBaku } = require('../models');

// --- GET ALL RIWAYAT STOK ---
exports.getAllRiwayatStok = async (req, res) => {
  try {
    const data = await RiwayatStok.findAll({
      include: [{ model: BahanBaku, attributes: ['nama_bahan','satuan'] }],
      order: [['tanggal','DESC']]
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- GET RIWAYAT BY BAHAN ---
exports.getRiwayatByBahan = async (req, res) => {
  try {
    const { id_bahan } = req.params;
    const data = await RiwayatStok.findAll({
      where: { id_bahan },
      include: [{ model: BahanBaku, attributes: ['nama_bahan','satuan'] }],
      order: [['tanggal','DESC']]
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- CREATE RIWAYAT MANUAL (Owner/Kasir) ---
exports.createRiwayat = async (req, res) => {
  try {
    const { id_bahan, jumlah_berubah, jenis_transaksi, keterangan } = req.body;

    const bahan = await BahanBaku.findOne({ where: { id_bahan } });
    if (!bahan) return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan' });

    // Update stok bahan juga
    bahan.stok_saat_ini += jumlah_berubah;
    await bahan.save();

    const newData = await RiwayatStok.create({
      id_bahan,
      id_user: req.user.id_user,
      jumlah_berubah,
      jenis_transaksi,
      keterangan,
      tanggal: new Date()
    });

    res.status(201).json({ success: true, message: 'Riwayat stok berhasil dicatat', data: newData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
