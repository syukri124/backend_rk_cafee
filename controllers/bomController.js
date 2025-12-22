const { BillOfMaterials, Menu, BahanBaku, sequelize } = require("../models");

exports.getAllBOM = async (req, res) => {
  try {
    const bom = await BillOfMaterials.findAll({
      include: [
        { model: Menu, attributes: ["id_menu", "nama_menu"] },
        { model: BahanBaku, attributes: ["id_bahan", "nama_bahan", "satuan"] },
      ],
      order: [["id_menu", "ASC"]],
    });

    const grouped = {};

    bom.forEach(item => {
      const idMenu = item.id_menu;

      if (!grouped[idMenu]) {
        grouped[idMenu] = {
          id_menu: idMenu,
          nama_menu: item.Menu.nama_menu,
          resep: [],
        };
      }

      grouped[idMenu].resep.push({
        id_bahan: item.id_bahan,
        nama_bahan: item.BahanBaku.nama_bahan,
        jumlah_dibutuhkan: item.jumlah_dibutuhkan, // ⬅️ TAKARAN RESEP
        satuan: item.BahanBaku.satuan,
      });
    });

    res.json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};



exports.getBOMByMenu = async (req, res) => {
  try {
    const { id_menu } = req.params;

    const bom = await BillOfMaterials.findAll({
      where: { id_menu },
      include: [
        { model: Menu, attributes: ["nama_menu"] },
        { model: BahanBaku, attributes: ["id_bahan", "nama_bahan", "satuan"] },
      ],
    });

    if (bom.length === 0) {
      return res.json({ success: true, data: null });
    }

    const resep = {
      id_menu,
      nama_menu: bom[0].Menu.nama_menu,
      bahan: bom.map(item => ({
        id_bahan: item.id_bahan,
        nama_bahan: item.BahanBaku.nama_bahan,
        jumlah_dibutuhkan: item.jumlah_dibutuhkan, // ⬅️ JUMLAH PER MENU
        satuan: item.BahanBaku.satuan,
      })),
    };

    res.json({ success: true, data: resep });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// --- C. CREATE BOM ---
exports.createBOM = async (req, res) => {
  const t = await BillOfMaterials.sequelize.transaction();

  try {
    const { id_menu, bahan } = req.body;

    if (!id_menu || !Array.isArray(bahan) || bahan.length === 0) {
      return res.status(400).json({
        success: false,
        message: "id_menu dan bahan wajib diisi",
      });
    }

    const dataBOM = bahan.map((item, index) => ({
      id_bom: `BOM-${Date.now()}-${index}`,
      id_menu,
      id_bahan: item.id_bahan,
      jumlah_dibutuhkan: item.jumlah_dibutuhkan,
    }));

    const newBOM = await BillOfMaterials.bulkCreate(dataBOM, {
      transaction: t,
    });

    await t.commit();

    res.status(201).json({
      success: true,
      message: "BOM berhasil dibuat",
      total_bahan: newBOM.length,
      data: newBOM,
    });
  } catch (err) {
    await t.rollback();

    res.status(500).json({
      success: false,
      error: err.message,
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
      return res.status(404).json({
        success: false,
        message: "BOM tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "BOM berhasil diupdate",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- E. DELETE BOM ---
exports.deleteBOM = async (req, res) => {
  try {
    const { id_bom } = req.params;

    const deleted = await BillOfMaterials.destroy({
      where: { id_bom },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "BOM tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "BOM berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- BULK CREATE BOM ---
exports.bulkCreateBOM = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const bomData = req.body.bom;

    if (!Array.isArray(bomData) || bomData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Data BOM harus berupa array",
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
          id_bom: `BOM-${String(counter++).padStart(4, "0")}`,
          id_menu: menu.id_menu,
          id_bahan: bahan.id_bahan,
          jumlah_dibutuhkan: bahan.jumlah_dibutuhkan,
        });
      }
    }

    await BillOfMaterials.bulkCreate(finalBOM, {
      validate: true,
      transaction: t,
    });

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Bulk BOM berhasil ditambahkan",
      total: finalBOM.length,
    });
  } catch (err) {
    await t.rollback();

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
