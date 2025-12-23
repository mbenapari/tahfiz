'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('memorization_records', {
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
      record_type: {
        type: Sequelize.ENUM('memorized', 'revised'),
        allowNull: false
      },
      surah_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'surahs',
          key: 'number'
        }
      },
      start_ayah: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      end_ayah: {
        type: Sequelize.INTEGER,
        allowNull: false
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

    // Add indexes
    await queryInterface.addIndex('memorization_records', ['tenant_id', 'student_id'], {
      name: 'idx_mem_tenant_student'
    });

    await queryInterface.addIndex('memorization_records', ['session_id', 'record_type'], {
      name: 'idx_mem_session_type'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('memorization_records');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_memorization_records_record_type";');
  }
};
