const { RiwayatStok, BahanBaku } = require("../models");
const konversi = require("../helpers/konversiSatuan");

// --- GET ALL RIWAYAT STOK ---
exports.getAllRiwayatStok = async (req, res) => {
  try {
    const data = await RiwayatStok.findAll({
      include: [
        {
          model: BahanBaku,
          attributes: ["nama_bahan", "satuan"],
        },
      ],
      order: [["tanggal", "DESC"]],
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
      include: [
        {
          model: BahanBaku,
          attributes: ["nama_bahan", "satuan"],
        },
      ],
      order: [["tanggal", "DESC"]],
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- CREATE RIWAYAT MANUAL (Owner/Kasir) ---
exports.createRiwayat = async (req, res) => {
  try {
    const {
      id_bahan,
      jumlah_berubah,
      satuan_input,
      jenis_transaksi,
      keterangan,
    } = req.body;

    const bahan = await BahanBaku.findOne({
      where: { id_bahan },
    });

    if (!bahan) {
      return res.status(404).json({
        success: false,
        message: "Bahan baku tidak ditemukan",
      });
    }

    const jumlahKonversi = konversi(
      jumlah_berubah,
      satuan_input,
      bahan.satuan
    );

    bahan.stok_saat_ini += jumlahKonversi;
    await bahan.save();

    const newData = await RiwayatStok.create({
      id_bahan,
      id_user: req.user.id_user,
      jumlah_berubah: jumlahKonversi,
      jenis_transaksi,
      keterangan,
      tanggal: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Riwayat stok berhasil dicatat",
      data: newData,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
