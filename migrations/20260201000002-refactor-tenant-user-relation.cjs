'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Remove tenant_id from users table
    await queryInterface.removeColumn('users', 'tenant_id');

    // 2. Add owner_id to tenants table
    await queryInterface.addColumn('tenants', 'owner_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    // 3. Create school_members table
    await queryInterface.createTable('school_members', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      school_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('student', 'instructor', 'admin'),
        allowNull: false,
        defaultValue: 'student',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add unique constraint for school_id + user_id
    await queryInterface.addIndex('school_members', ['school_id', 'user_id'], {
      unique: true,
      name: 'idx_school_members_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('school_members');
    await queryInterface.removeColumn('tenants', 'owner_id');
    await queryInterface.addColumn('users', 'tenant_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id',
      },
    });
  }
};
