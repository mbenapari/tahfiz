'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('revision_records', 'rating', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5,
      },
      comment: 'Revision performance rating (1-5 scale)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('revision_records', 'rating');
  }
};
