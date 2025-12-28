const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Menu = sequelize.define('Menu', {
    id_menu: {
      type: DataTypes.STRING(50),
      primaryKey: true,
    },
    nama_menu: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    harga: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    kategori: {
      type: DataTypes.STRING(50),
    },
    status_tersedia: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    gambar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: 'menus',
    timestamps: false,
  });

  Menu.associate = (models) => {
    Menu.hasMany(models.BillOfMaterials, { foreignKey: 'id_menu', as: 'bom' });
    Menu.hasMany(models.OrderItem, { foreignKey: 'id_menu', as: 'order_items' });
  };

  return Menu;
};
