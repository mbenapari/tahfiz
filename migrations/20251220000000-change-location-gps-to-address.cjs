'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('tenants');
    
    if (!tableInfo.address) {
      await queryInterface.addColumn('tenants', 'address', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'School address',
      });
    }

    if (tableInfo.location_gps) {
      await queryInterface.removeColumn('tenants', 'location_gps');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('tenants');

    if (tableInfo.address) {
      await queryInterface.removeColumn('tenants', 'address');
    }

    // Note: We don't necessarily want to restore location_gps in down() if it was unwanted, 
    // but strictly speaking, down() should reverse up(). 
    // However, since location_gps was "deleted" from codebase, we might not want it back.
    // For completeness of a reversible migration, we can add it back if we want to be strict,
    if (!tableInfo.location_gps) {
      await queryInterface.addColumn('tenants', 'location_gps', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
  }
};
