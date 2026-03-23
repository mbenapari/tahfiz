'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('revision_records', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      tenant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      session_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'sessions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      student_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      instructor_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      surah_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'surahs',
          key: 'number'
        }
      },
      start_ayah: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      end_ayah: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      start_page: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      end_page: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_full_surah: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      notes: {
        type: Sequelize.STRING(1024),
        allowNull: true
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
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('revision_records', ['tenant_id', 'student_id'], {
      name: 'idx_revision_tenant_student'
    });

    await queryInterface.addIndex('revision_records', ['session_id'], {
      name: 'idx_revision_session'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('revision_records');
  }
};
