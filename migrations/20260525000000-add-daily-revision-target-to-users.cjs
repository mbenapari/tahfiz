'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'daily_revision_target', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Student specific daily revision target (e.g. number of pages or surahs)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'daily_revision_target');
  }
};
