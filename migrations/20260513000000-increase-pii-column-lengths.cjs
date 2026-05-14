'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Increase column lengths for Users table
    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('users', 'student_identifier', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    // Increase column lengths for SystemOwners table
    await queryInterface.changeColumn('system_owners', 'phone', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert column lengths for Users table
    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.changeColumn('users', 'student_identifier', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // Revert column lengths for SystemOwners table
    await queryInterface.changeColumn('system_owners', 'phone', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
  }
};
