'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedbacks', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
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
      tenant_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      category: {
        type: Sequelize.ENUM('bug', 'feature_request', 'general', 'ux', 'other'),
        allowNull: false,
        defaultValue: 'general',
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('feedbacks', ['user_id']);
    await queryInterface.addIndex('feedbacks', ['tenant_id']);
    await queryInterface.addIndex('feedbacks', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('feedbacks');
    // Drop the ENUM types if they are created automatically in Postgres
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_feedbacks_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_feedbacks_status";');
  }
};
