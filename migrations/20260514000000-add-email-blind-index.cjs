'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add email_blind_index to Users table
    await queryInterface.addColumn('users', 'email_blind_index', {
      type: Sequelize.STRING(64), // SHA-256 hex is 64 chars
      allowNull: true
    });
    await queryInterface.addIndex('users', ['email_blind_index'], {
      name: 'idx_users_email_blind_index'
    });

    // Add email_blind_index to SystemOwners table
    await queryInterface.addColumn('system_owners', 'email_blind_index', {
      type: Sequelize.STRING(64),
      allowNull: true
    });
    await queryInterface.addIndex('system_owners', ['email_blind_index'], {
      name: 'idx_system_owners_email_blind_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_email_blind_index');
    await queryInterface.removeColumn('users', 'email_blind_index');
    
    await queryInterface.removeIndex('system_owners', 'idx_system_owners_email_blind_index');
    await queryInterface.removeColumn('system_owners', 'email_blind_index');
  }
};
