const { BahanBaku, RiwayatStok, BillOfMaterials } = require('../models');

// --- GET ALL BAHAN BAKU ---
exports.getAllBahan = async (req, res) => {
  try {
    const bahan = await BahanBaku.findAll({
      order: [['nama_bahan', 'ASC']]
    });
    res.json({ success: true, data: bahan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- CREATE BAHAN BAKU ---
exports.createBahan = async (req, res) => {
  try {
    const { id_bahan, nama_bahan, stok_saat_ini, stok_minimum, satuan } = req.body;

    if (!id_bahan || !nama_bahan || !satuan) {
      return res.status(400).json({ success: false, message: "id_bahan, nama_bahan, dan satuan wajib diisi" });
    }

    const newBahan = await BahanBaku.create({
      id_bahan,
      nama_bahan,
      stok_saat_ini: typeof stok_saat_ini === 'number' ? stok_saat_ini : 0,
      stok_minimum: typeof stok_minimum === 'number' ? stok_minimum : 0,
      satuan
    });

    res.status(201).json({ success: true, message: "Bahan baku berhasil ditambahkan", data: newBahan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal menambahkan bahan", error: err.message });
  }
};

// --- UPDATE STOK BAHAN BAKU ---
exports.updateBahan = async (req, res) => {
  try {
    const { id_bahan } = req.params;
    const { jumlah, keterangan } = req.body;

    const bahan = await BahanBaku.findOne({ where: { id_bahan } });
    if (!bahan) return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan' });

    bahan.stok_saat_ini += jumlah;
    await bahan.save();

    // Simpan riwayat stok otomatis
    await RiwayatStok.create({
      id_bahan,
      id_user: req.user.id_user,
      jumlah_berubah: jumlah,
      jenis_transaksi: jumlah > 0 ? 'TAMBAH' : 'KURANG',
      keterangan,
      tanggal: new Date()
    });

    res.json({ success: true, message: 'Stok bahan berhasil diperbarui', data: bahan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal update stok', error: err.message });
  }
};

// --- HAPUS BAHAN BAKU ---
exports.deleteBahan = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BahanBaku.destroy({ where: { id_bahan: id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan' });

    res.json({ success: true, message: 'Bahan baku berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- FUNGSI UNTUK MENGURANGI STOK OTOMATIS BERDASARKAN BOM ---
exports.kurangiStokDariOrder = async (id_menu, jumlah_order, id_user) => {
  // Cari semua bahan yang digunakan untuk menu ini
  const bom = await BillOfMaterials.findAll({ where: { id_menu } });

  for (const item of bom) {
    const bahan = await BahanBaku.findOne({ where: { id_bahan: item.id_bahan } });
    if (!bahan) throw new Error(`Bahan ${item.id_bahan} tidak ditemukan`);

    const totalKurang = item.jumlah_dibutuhkan * jumlah_order;
    bahan.stok_saat_ini -= totalKurang;
    await bahan.save();

    // Simpan riwayat stok
    await RiwayatStok.create({
      id_bahan: bahan.id_bahan,
      id_user,
      jumlah_berubah: -totalKurang,
      jenis_transaksi: 'KURANG',
      keterangan: `Order menu ${id_menu}`,
      tanggal: new Date()
    });
  }
};
