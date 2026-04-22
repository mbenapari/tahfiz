'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blacklisted_tokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('blacklisted_tokens', ['token'], {
      unique: true,
      name: 'blacklisted_tokens_token_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('blacklisted_tokens');
  }
};
