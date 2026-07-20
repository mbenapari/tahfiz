'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('memorization_records', 'rating', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5,
      },
      comment: 'Memorization performance rating (1-5 scale)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('memorization_records', 'rating');
  }
};
