const { Order, OrderItem, Menu } = require('../models');
const buildDateRange = require('../helpers/dateRange');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

exports.getLaporanPenjualan = async (req, res) => {
  try {
    const { startDate, endDate } = buildDateRange(req.query);

    // 🔹 Ringkasan Order
    const orderSummary = await Order.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id_order')), 'total_order'],
        [sequelize.fn('SUM', sequelize.col('total_bayar')), 'total_omzet']
      ],
      where: {
        tanggal: { [Op.between]: [startDate, endDate] }
      },
      raw: true
    });

    // 🔹 Total Item Terjual
    const totalItem = await OrderItem.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('jumlah')), 'total_item']
      ],
      include: [{
        model: Order,
        attributes: [],
        where: {
          tanggal: { [Op.between]: [startDate, endDate] }
        }
      }],
      raw: true
    });

    // 🔹 Top 3 Menu Terlaris
    const menuTerlaris = await OrderItem.findAll({
      attributes: [
        'id_menu',
        [sequelize.fn('SUM', sequelize.col('OrderItem.jumlah')), 'total_terjual']
      ],
      include: [
        {
          model: Menu,
          as: 'menu_detail',
          attributes: ['id_menu', 'nama_menu']
        },
        {
          model: Order,
          attributes: [],
          where: {
            tanggal: { [Op.between]: [startDate, endDate] }
          }
        }
      ],
      group: [
        'OrderItem.id_menu',
        'menu_detail.id_menu',
        'menu_detail.nama_menu'
      ],
      order: [[sequelize.literal('total_terjual'), 'DESC']],
      limit: 3
    });

    // 🔹 Mapping hasil menu terlaris
    const topMenu = menuTerlaris.map(item => ({
      id_menu: item.id_menu,
      nama_menu: item.menu_detail.nama_menu,
      total_terjual: Number(item.get('total_terjual'))
    }));

    // 🔹 Response
    res.json({
      periode: { dari: startDate, sampai: endDate },
      total_order: Number(orderSummary.total_order || 0),
      total_omzet: Number(orderSummary.total_omzet || 0),
      total_item: Number(totalItem.total_item || 0),
      menu_terlaris: topMenu
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
