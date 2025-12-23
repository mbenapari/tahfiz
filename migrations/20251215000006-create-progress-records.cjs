'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create surah_progress table
    await queryInterface.createTable('surah_progress', {
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
      student_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      surah_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'surahs',
          key: 'number'
        }
      },
      completed_on: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      read_full_count: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      last_read_on: {
        type: Sequelize.DATEONLY,
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

    // Add unique index for surah_progress
    await queryInterface.addIndex('surah_progress', ['student_id', 'surah_number'], {
      name: 'ux_student_surah',
      unique: true
    });

    // Create juz_progress table
    await queryInterface.createTable('juz_progress', {
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
      student_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      juz_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      completed_on: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      full_reads: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_read_on: {
        type: Sequelize.DATEONLY,
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

    // Add unique index for juz_progress
    await queryInterface.addIndex('juz_progress', ['student_id', 'juz_number'], {
      name: 'ux_student_juz',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('juz_progress');
    await queryInterface.dropTable('surah_progress');
  }
};
