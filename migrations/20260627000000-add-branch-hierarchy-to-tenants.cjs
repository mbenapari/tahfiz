'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Branch hierarchy fields
    await queryInterface.addColumn('tenants', 'parent_school_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn('tenants', 'is_branch', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('tenants', 'branch_code', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('tenants', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('tenants', 'deactivated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Inheritance override fields
    await queryInterface.addColumn('tenants', 'override_study_days', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('tenants', 'override_schedule_mode', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn('tenants', 'override_memorization_subtypes', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    // Indexes
    await queryInterface.addIndex('tenants', ['parent_school_id'], {
      name: 'idx_school_parent_id',
    });

    await queryInterface.addIndex('tenants', ['is_branch'], {
      name: 'idx_school_is_branch',
    });

    await queryInterface.addIndex('tenants', ['branch_code'], {
      name: 'idx_school_branch_code',
    });

    // Backfill: mark all existing schools as root/parent schools
    await queryInterface.sequelize.query(
      'UPDATE tenants SET is_branch = false WHERE is_branch IS NULL'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('tenants', 'idx_school_branch_code');
    await queryInterface.removeIndex('tenants', 'idx_school_is_branch');
    await queryInterface.removeIndex('tenants', 'idx_school_parent_id');

    await queryInterface.removeColumn('tenants', 'override_memorization_subtypes');
    await queryInterface.removeColumn('tenants', 'override_schedule_mode');
    await queryInterface.removeColumn('tenants', 'override_study_days');
    await queryInterface.removeColumn('tenants', 'deactivated_at');
    await queryInterface.removeColumn('tenants', 'is_active');
    await queryInterface.removeColumn('tenants', 'branch_code');
    await queryInterface.removeColumn('tenants', 'is_branch');
    await queryInterface.removeColumn('tenants', 'parent_school_id');
  }
};
