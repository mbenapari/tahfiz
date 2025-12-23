'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create surahs table
    await queryInterface.createTable('surahs', {
      number: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      ayah_count: {
        type: Sequelize.INTEGER,
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
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    });

    // Create juz_map table
    await queryInterface.createTable('juz_map', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      juz_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      surah_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'surahs',
          key: 'number'
        },
        onDelete: 'CASCADE' // Assuming cascade delete if a surah is deleted, though surahs are static
      },
      start_ayah: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      end_ayah: {
        type: Sequelize.INTEGER,
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
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    });

    // Add index to juz_map
    await queryInterface.addIndex('juz_map', ['juz_number', 'surah_number'], {
      name: 'idx_juz_surah'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('juz_map');
    await queryInterface.dropTable('surahs');
  }
};
