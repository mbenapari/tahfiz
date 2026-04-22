'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'grade_level', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'class_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'last_login_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'grade_level');
    await queryInterface.removeColumn('users', 'class_name');
    await queryInterface.removeColumn('users', 'last_login_at');
  }
};
