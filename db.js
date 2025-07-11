require('dotenv').config(); // Importa dotenv

const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'), // default 1433
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

module.exports = {
  sql,
  config,
};
