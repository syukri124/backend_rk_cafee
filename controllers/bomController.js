const { BillOfMaterials, Menu, BahanBaku, sequelize } = require('../models');

// --- A. GET ALL BOM ---
exports.getAllBOM = async (req, res) => {
  try {
    const bom = await BillOfMaterials.findAll({
      include: [
        { model: Menu, attributes: ['nama_menu'] },
        { model: BahanBaku, attributes: ['nama_bahan', 'satuan'] }
      ]
    });

    res.json({ success: true, data: bom });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- B. GET BOM BY MENU ---
exports.getBOMByMenu = async (req, res) => {
  try {
    const { id_menu } = req.params;

    const bom = await BillOfMaterials.findAll({
      where: { id_menu },
      include: [
        { model: BahanBaku, attributes: ['nama_bahan', 'satuan'] }
      ]
    });

    res.json({ success: true, data: bom });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- C. CREATE BOM ---
exports.createBOM = async (req, res) => {
  const t = await BillOfMaterials.sequelize.transaction();

  try {
    const { id_menu, bahan } = req.body;

    if (!id_menu || !bahan || !Array.isArray(bahan) || bahan.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'id_menu dan bahan wajib diisi'
      });
    }

    const dataBOM = bahan.map((item, index) => ({
      id_bom: `BOM-${Date.now()}-${index}`,
      id_menu,
      id_bahan: item.id_bahan,
      jumlah_dibutuhkan: item.jumlah_dibutuhkan
    }));

    const newBOM = await BillOfMaterials.bulkCreate(dataBOM, {
      transaction: t
    });

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'BOM berhasil dibuat',
      total_bahan: newBOM.length,
      data: newBOM
    });

  } catch (err) {
    await t.rollback();
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// --- D. UPDATE BOM ---
exports.updateBOM = async (req, res) => {
  try {
    const { id_bom } = req.params;
    const { id_menu, id_bahan, jumlah_dibutuhkan } = req.body;

    const [updated] = await BillOfMaterials.update(
      { id_menu, id_bahan, jumlah_dibutuhkan },
      { where: { id_bom } }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'BOM tidak ditemukan' });
    }

    res.json({ success: true, message: 'BOM berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- E. DELETE BOM ---
exports.deleteBOM = async (req, res) => {
  try {
    const { id_bom } = req.params;

    const deleted = await BillOfMaterials.destroy({
      where: { id_bom }
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'BOM tidak ditemukan' });
    }

    res.json({ success: true, message: 'BOM berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};




exports.bulkCreateBOM = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const bomData = req.body.bom;

    if (!Array.isArray(bomData) || bomData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Data BOM harus berupa array"
      });
    }

    let counter = 1;
    const finalBOM = [];

    for (const menu of bomData) {
      if (!menu.id_menu || !Array.isArray(menu.bahan)) {
        throw new Error("Format BOM tidak valid");
      }

      for (const bahan of menu.bahan) {
        finalBOM.push({
          id_bom: `BOM-${String(counter++).padStart(4, '0')}`,
          id_menu: menu.id_menu,
          id_bahan: bahan.id_bahan,
          jumlah_dibutuhkan: bahan.jumlah_dibutuhkan
        });
      }
    }

    await BillOfMaterials.bulkCreate(finalBOM, {
      validate: true,
      transaction: t
    });

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Bulk BOM berhasil ditambahkan",
      total: finalBOM.length
    });

  } catch (err) {
    await t.rollback();
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
