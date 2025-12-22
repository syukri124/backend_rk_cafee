const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,       // nama database
  process.env.DB_USER,       // username database
  process.env.DB_PASSWORD,   // password database
  {
    host: process.env.DB_HOST, // host
    port: process.env.DB_PORT, // port
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
      acquire: 30000,
    },
  }
);

module.exports = sequelize;
