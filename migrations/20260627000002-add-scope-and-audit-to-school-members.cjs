'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Scope control fields
    await queryInterface.addColumn('school_members', 'scope_type', {
      type: Sequelize.ENUM('school', 'branch', 'all'),
      allowNull: false,
      defaultValue: 'school',
    });

    await queryInterface.addColumn('school_members', 'is_primary_admin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Audit fields
    await queryInterface.addColumn('school_members', 'granted_by_user_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn('school_members', 'granted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Indexes
    await queryInterface.addIndex('school_members', ['scope_type'], {
      name: 'idx_school_member_scope',
    });

    await queryInterface.addIndex('school_members', ['granted_by_user_id'], {
      name: 'idx_school_member_granted_by',
    });

    // Backfill existing rows
    await queryInterface.sequelize.query(
      'UPDATE school_members SET scope_type = \'school\', is_primary_admin = false WHERE scope_type IS NULL'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('school_members', 'idx_school_member_granted_by');
    await queryInterface.removeIndex('school_members', 'idx_school_member_scope');

    await queryInterface.removeColumn('school_members', 'granted_at');
    await queryInterface.removeColumn('school_members', 'granted_by_user_id');
    await queryInterface.removeColumn('school_members', 'is_primary_admin');
    await queryInterface.removeColumn('school_members', 'scope_type');

    // Clean up ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_school_members_scope_type"');
  }
};
