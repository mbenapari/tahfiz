'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tenants', 'start_time', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('tenants', 'end_time', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('tenants', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('tenants', 'phone', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tenants', 'start_time');
    await queryInterface.removeColumn('tenants', 'end_time');
    await queryInterface.removeColumn('tenants', 'email');
    await queryInterface.removeColumn('tenants', 'phone');
  }
};
