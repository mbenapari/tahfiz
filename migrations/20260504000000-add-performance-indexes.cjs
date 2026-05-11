'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('attendance', ['session_id'], {
      name: 'idx_attendance_session',
      concurrent: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('attendance', 'idx_attendance_session');
  }
};
