const { Menu, BahanBaku, BillOfMaterials, RiwayatStok, Order, OrderItem, sequelize } = require('../models');

const generateOrderId = async () => {
  // Ambil order terakhir berdasarkan nomor terbesar
  const lastOrder = await Order.findOne({
    order: [['id_order', 'DESC']]
  });

  let nextNumber = 1;

  if (lastOrder && lastOrder.id_order) {
    const lastNumber = parseInt(lastOrder.id_order.replace('ORD-', ''));
    nextNumber = lastNumber + 1;
  }

  // Format menjadi ORD-0001, ORD-0002, dst.
  const padded = String(nextNumber).padStart(4, '0');
  return `ORD-${padded}`;
};

  // =============================
  //  CREATE ORDER
  // =============================
  exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id_user, items } = req.body;

    // 1️⃣ VALIDASI
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Item order tidak boleh kosong"
      });
    }

    // 2️⃣ GENERATE ID ORDER
    const id_order = await generateOrderId();

    // 3️⃣ BUAT ORDER HEADER DULU (WAJIB)
    const order = await Order.create({
      id_order,
      total_bayar: 0, // nanti diupdate
      id_user,
      status_pesanan: "BARU",
      tanggal: new Date()
    }, { transaction: t });

    let total_bayar = 0;

    // 4️⃣ LOOP ITEM
    for (const item of items) {

      const menu = await Menu.findByPk(item.id_menu, { transaction: t });
      if (!menu) {
        throw new Error(`Menu ${item.id_menu} tidak ditemukan`);
      }

      const subtotal = menu.harga * item.jumlah;
      total_bayar += subtotal;

      // 5️⃣ CEK BOM MENU
      const bomList = await BillOfMaterials.findAll({
        where: { id_menu: menu.id_menu },
        transaction: t
      });

      if (!bomList.length) {
        throw new Error(`Menu ${menu.nama_menu} belum memiliki BOM`);
      }

      // 6️⃣ CEK & KURANGI STOK
      for (const bom of bomList) {
        const bahan = await BahanBaku.findByPk(bom.id_bahan, { transaction: t });

        if (!bahan) {
          throw new Error(`Bahan ${bom.id_bahan} tidak ditemukan`);
        }

        const total_pengurangan = bom.jumlah_dibutuhkan * item.jumlah;

        if (bahan.stok_saat_ini < total_pengurangan) {
          throw new Error(`Stok ${bahan.nama_bahan} tidak mencukupi`);
        }

        bahan.stok_saat_ini -= total_pengurangan;
        await bahan.save({ transaction: t });

        await RiwayatStok.create({
          id_bahan: bahan.id_bahan,
          id_user,
          jumlah_berubah: -total_pengurangan,
          jenis_transaksi: 'KURANG',
          keterangan: `Order ${menu.nama_menu}`,
          tanggal: new Date()
        }, { transaction: t });
      }

      // 7️⃣ SIMPAN ORDER ITEM (SETELAH ORDER ADA)
      await OrderItem.create({
        id_order: order.id_order,
        id_menu: menu.id_menu,
        jumlah: item.jumlah,
        subtotal
      }, { transaction: t });
    }

    // 8️⃣ UPDATE TOTAL BAYAR ORDER
    order.total_bayar = total_bayar;
    await order.save({ transaction: t });

    // 9️⃣ COMMIT
    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Order berhasil dibuat",
      data: {
        id_order: order.id_order,
        total_bayar
      }
    });

  } catch (error) {
    await t.rollback();
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


  // =============================
  //  UPDATE STATUS ORDER
  // =============================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_pesanan } = req.body;

    // Cari order berdasarkan ID
    const order = await Order.findOne({ where: { id_order: id } });
    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    // Validasi status
    const allowed = ["BARU", "SEDANG DIBUAT", "SELESAI"];
    if (!allowed.includes(status_pesanan)) {
      return res.status(400).json({ 
        message: "Status tidak valid. Gunakan: BARU, SEDANG DIBUAT, SELESAI" 
      });
    }

    // Update status
    order.status_pesanan = status_pesanan;
    await order.save();

    return res.json({
      message: "Status order berhasil diperbarui",
      order
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message
    });
  }
};


  // =============================
  //  LAYAR DAPUR
  // =============================
  exports.getKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        status_pesanan: ['BARU', 'SEDANG DIBUAT', 'SELESAI']
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Menu,
              as: 'menu_detail', // sesuai model kamu
              attributes: ['nama_menu', 'harga']
            }
          ]
        }
      ],
      order: [['tanggal', 'ASC']]
    });

    return res.json({
      message: "Daftar order untuk dapur",
      total: orders.length,
      orders
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};
