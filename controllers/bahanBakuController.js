const { BahanBaku, RiwayatStok, BillOfMaterials, sequelize } = require('../models');
const konversi = require('../helpers/konversiSatuan');

// --- GET ALL BAHAN BAKU ---
exports.getAllBahan = async (req, res) => {
  try {
    const bahan = await BahanBaku.findAll({
      order: [["nama_bahan", "ASC"]],
    });

    res.json({ success: true, data: bahan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- CREATE BAHAN BAKU ---
exports.createBahan = async (req, res) => {
  try {
    const {
      id_bahan,
      nama_bahan,
      stok_saat_ini,
      stok_minimum,
      satuan,        // satuan dasar (g / ml / pcs)
      satuan_input,  // satuan dari user
    } = req.body;

    if (!id_bahan || !nama_bahan || !satuan || !satuan_input) {
      return res.status(400).json({
        success: false,
        message: "Field wajib belum lengkap",
      });
    }

    const stokKonversi = konversi(
      stok_saat_ini || 0,
      satuan_input,
      satuan
    );

    const newBahan = await BahanBaku.create({
      id_bahan,
      nama_bahan,
      stok_saat_ini: stokKonversi,
      stok_minimum: stok_minimum || 0,
      satuan,
    });

    res.status(201).json({
      success: true,
      message: "Bahan baku berhasil ditambahkan",
      data: newBahan,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- UPDATE STOK BAHAN BAKU ---
exports.updateBahan = async (req, res) => {
  try {
    const { id_bahan } = req.params;
    const { jumlah, satuan_input, keterangan, stok_minimum } = req.body;

    const bahan = await BahanBaku.findOne({ where: { id_bahan } });

    if (!bahan) {
      return res.status(404).json({
        success: false,
        message: "Bahan baku tidak ditemukan"
      });
    }

    // ===============================
    // 🔹 MODE 1: UPDATE STOK MINIMUM
    // ===============================
    if (typeof stok_minimum === 'number') {
      bahan.stok_minimum = stok_minimum;
      await bahan.save();

      return res.json({
        success: true,
        message: "Stok minimum berhasil diperbarui",
        data: bahan
      });
    }

    // ===============================
    // 🔹 MODE 2: TAMBAH / KURANG STOK
    // ===============================
    if (typeof jumlah !== 'number' || !satuan_input) {
      return res.status(400).json({
        success: false,
        message: "Gunakan field jumlah (number) & satuan_input"
      });
    }

    bahan.stok_saat_ini = Number(bahan.stok_saat_ini || 0);

    const jumlahKonversi = konversi(
      jumlah,
      satuan_input,
      bahan.satuan
    );

    if (isNaN(jumlahKonversi)) {
      return res.status(400).json({
        success: false,
        message: "Konversi satuan gagal"
      });
    }

    bahan.stok_saat_ini += jumlahKonversi;
    await bahan.save();

    await RiwayatStok.create({
      id_bahan,
      id_user: req.user.id_user,
      jumlah_berubah: jumlahKonversi,
      jenis_transaksi: jumlahKonversi > 0 ? "TAMBAH" : "KURANG",
      keterangan,
      tanggal: new Date()
    });

    res.json({
      success: true,
      message: "Stok bahan berhasil diperbarui",
      data: bahan
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// --- HAPUS BAHAN BAKU ---
exports.deleteBahan = async (req, res) => {
  try {
    const { id_bahan } = req.params;

    const deleted = await BahanBaku.destroy({
      where: { id_bahan },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Bahan baku tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Bahan baku berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- FUNGSI UNTUK MENGURANGI STOK OTOMATIS BERDASARKAN BOM ---
exports.kurangiStokDariOrder = async (id_menu, jumlah_order, id_user) => {
  const bom = await BillOfMaterials.findAll({
    where: { id_menu },
  });

  if (!bom.length) {
    throw new Error("BOM tidak ditemukan untuk menu ini");
  }

  for (const item of bom) {
    const bahan = await BahanBaku.findOne({
      where: { id_bahan: item.id_bahan },
    });

    if (!bahan) {
      throw new Error(`Bahan ${item.id_bahan} tidak ditemukan`);
    }

    const totalKurang = item.jumlah_dibutuhkan * jumlah_order;

    if (bahan.stok_saat_ini < totalKurang) {
      throw new Error(`Stok ${bahan.nama_bahan} tidak mencukupi`);
    }

    bahan.stok_saat_ini -= totalKurang;
    await bahan.save();

    await RiwayatStok.create({
      id_bahan: bahan.id_bahan,
      id_user,
      jumlah_berubah: -totalKurang,
      jenis_transaksi: "KURANG",
      keterangan: `Order menu ${id_menu}`,
      tanggal: new Date(),
    });
  }
};

// --- BULK CREATE BAHAN BAKU ---
exports.bulkCreateBahanBaku = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { bahan } = req.body;

    if (!Array.isArray(bahan) || bahan.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Data bahan harus berupa array",
      });
    }

    await BahanBaku.bulkCreate(bahan, {
      validate: true,
      transaction: t,
    });

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Bulk bahan baku berhasil ditambahkan",
      total: bahan.length,
    });
  } catch (err) {
    await t.rollback();

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};