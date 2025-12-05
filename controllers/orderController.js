const { Order, OrderItem, Menu, sequelize } = require('../models');
const bahanBakuController = require('./bahanBakuController'); // import controller bahan baku

// --- A. CREATE ORDER (Transaksi Database) ---
exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction(); // Mulai Transaksi agar aman
  
  try {
    const { id_user, total_bayar, items } = req.body;
    const id_order = 'ORD-' + Date.now();

    // 1. Simpan Header Order
    await Order.create({
      id_order,
      total_bayar,
      id_user,
      status_pesanan: 'BARU'
    }, { transaction: t });

    // 2. Siapkan data items
    const itemsData = items.map(item => ({
      id_order: id_order,
      id_menu: item.id_menu,
      jumlah: item.jumlah,
      subtotal: item.subtotal,
      catatan: item.catatan
    }));

    // 3. Simpan Detail Items (Bulk Create)
    await OrderItem.bulkCreate(itemsData, { transaction: t });

    // 4. Kurangi stok otomatis berdasarkan BOM untuk setiap item
    for (const item of items) {
      await bahanBakuController.kurangiStokDariOrder(item.id_menu, item.jumlah, id_user);
    }

    // 5. Commit (Simpan Permanen)
    await t.commit();
    
    res.status(201).json({ success: true, message: 'Order berhasil', id_order });

  } catch (err) {
    // Rollback (Batalkan jika error)
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- B. GET KITCHEN ORDERS (Layar Dapur) ---
exports.getKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status_pesanan: ['BARU', 'DIBUAT'] },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Menu, as: 'menu_detail', attributes: ['nama_menu'] }]
        }
      ],
      order: [['tanggal', 'ASC']]
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- C. GET ALL ORDERS (Riwayat) ---
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['tanggal', 'DESC']]
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- D. UPDATE STATUS ---
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_pesanan } = req.body;

    const [updated] = await Order.update(
      { status_pesanan },
      { where: { id_order: id } }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    res.json({ success: true, message: 'Status order diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- E. DELETE ORDER (Void) ---
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Order.destroy({ where: { id_order: id } });

    if (!deleted) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    res.json({ success: true, message: 'Order berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};