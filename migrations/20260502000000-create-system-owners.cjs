'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('system_owners', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('sys_admin', 'super'),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('system_owners', ['email'], {
      name: 'idx_system_owners_email',
      unique: true
    });

    // Insert role records into roles table so these roles exist (no permissions yet)
    // Only insert if roles table exists; this assumes RBAC migrations have run already.
    await queryInterface.bulkInsert('roles', [
      {
        name: 'System Administrator',
        slug: 'sys_admin',
        description: 'System administrator',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Super',
        slug: 'super',
        description: 'Super role',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      slug: {
        [Sequelize.Op.in]: ['sys_admin', 'super']
      }
    }, {});

    await queryInterface.dropTable('system_owners');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_system_owners_role";');
  }
};
