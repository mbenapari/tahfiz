'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const email = process.env.DEFAULT_SYSTEM_OWNER_EMAIL || 'owner@example.com';
    const passwordPlain = process.env.DEFAULT_SYSTEM_OWNER_PASSWORD || 'changeme';
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(passwordPlain, 12);

    // Insert default system owner if not exists
    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM system_owners WHERE email = :email',
      { replacements: { email }, type: Sequelize.QueryTypes.SELECT }
    );

    if (!existing) {
      await queryInterface.bulkInsert('system_owners', [
        {
          name: 'Default System Owner',
          email,
          password: passwordHash,
          phone: process.env.DEFAULT_SYSTEM_OWNER_PHONE || null,
          role: 'super',
          created_at: now,
          updated_at: now
        }
      ], {});
    }
  },

  async down(queryInterface, Sequelize) {
    const email = process.env.DEFAULT_SYSTEM_OWNER_EMAIL || 'owner@example.com';
    await queryInterface.bulkDelete('system_owners', { email }, {});
  }
};
