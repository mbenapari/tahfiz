'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('revision_records', 'start_surah_number', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'surahs',
        key: 'number'
      }
    });

    await queryInterface.addColumn('revision_records', 'end_surah_number', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'surahs',
        key: 'number'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('revision_records', 'start_surah_number');
    await queryInterface.removeColumn('revision_records', 'end_surah_number');
  }
};
