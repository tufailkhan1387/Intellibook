const { Sequelize } = require('sequelize');

// Initialize Sequelize
const sequelize = new Sequelize('voting', 'root', null, {
    host: 'localhost',
    dialect: 'mysql', // or 'postgres', 'sqlite', 'mariadb', 'mssql'
});

module.exports = sequelize;
