'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // School context and access tracking fields
    await queryInterface.addColumn('users', 'active_school_context', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'accessible_school_ids', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });

    await queryInterface.addColumn('users', 'management_parent_school_ids', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });

    await queryInterface.addColumn('users', 'can_manage_branches', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Indexes
    await queryInterface.addIndex('users', ['active_school_context'], {
      name: 'idx_user_active_context',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_user_active_context');

    await queryInterface.removeColumn('users', 'can_manage_branches');
    await queryInterface.removeColumn('users', 'management_parent_school_ids');
    await queryInterface.removeColumn('users', 'accessible_school_ids');
    await queryInterface.removeColumn('users', 'active_school_context');
  }
};
