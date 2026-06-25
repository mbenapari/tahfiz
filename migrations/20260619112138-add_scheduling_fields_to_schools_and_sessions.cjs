'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add scheduling fields to tenants (School)
    await queryInterface.addColumn('tenants', 'schedule_mode', {
      type: Sequelize.STRING(20),
      defaultValue: 'simple',
      allowNull: false
    });

    await queryInterface.addColumn('tenants', 'session_type_day_map', {
      type: Sequelize.JSON,
      allowNull: true
    });

    await queryInterface.addColumn('tenants', 'enabled_memorization_subtypes', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    // Add recording_date to sessions
    await queryInterface.addColumn('sessions', 'recording_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    // Backfill recording_date = session_date
    await queryInterface.sequelize.query(
      'UPDATE sessions SET recording_date = session_date WHERE recording_date IS NULL'
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tenants', 'schedule_mode');
    await queryInterface.removeColumn('tenants', 'session_type_day_map');
    await queryInterface.removeColumn('tenants', 'enabled_memorization_subtypes');
    await queryInterface.removeColumn('sessions', 'recording_date');
  }
};
