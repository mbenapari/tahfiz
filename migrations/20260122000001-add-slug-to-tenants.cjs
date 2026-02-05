'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tenants', 'slug', {
      type: Sequelize.STRING(255),
      allowNull: true, // Allow null initially for existing records
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tenants', 'slug');
  }
};
