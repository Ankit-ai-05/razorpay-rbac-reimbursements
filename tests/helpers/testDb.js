'use strict';

/**
 * Test database helper.
 * Uses a separate test DB to avoid polluting development data.
 */

process.env.NODE_ENV = 'test';
require('dotenv').config();

const { sequelize } = require('../../src/models');

const setupTestDb = async () => {
  await sequelize.sync({ force: true });
};

const teardownTestDb = async () => {
  await sequelize.close();
};

const clearTable = async (tableName) => {
  await sequelize.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
};

module.exports = { setupTestDb, teardownTestDb, clearTable, sequelize };
