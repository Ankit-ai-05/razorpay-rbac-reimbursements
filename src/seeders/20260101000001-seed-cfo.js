'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('CFO#ORG@April2026', 12);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'Chief Financial Officer',
        email: 'cfo@org.com',
        password_hash: passwordHash,
        role: 'CFO',
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'cfo@org.com' }, {});
  },
};
