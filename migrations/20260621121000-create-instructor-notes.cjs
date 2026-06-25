'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instructor_notes', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      target_type: {
        type: Sequelize.ENUM('revision', 'hifz', 'session'),
        allowNull: false,
      },
      target_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      instructor_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      student_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      visibility: {
        type: Sequelize.ENUM('public', 'private'),
        allowNull: false,
        defaultValue: 'private',
      },
      annotation_ref: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('instructor_notes', ['tenant_id', 'student_id'], {
      name: 'idx_in_tenant_student',
    });
    await queryInterface.addIndex('instructor_notes', ['target_type', 'target_id'], {
      name: 'idx_in_target',
    });
    await queryInterface.addIndex('instructor_notes', ['instructor_id'], {
      name: 'idx_in_instructor',
    });
    await queryInterface.addIndex('instructor_notes', ['created_at'], {
      name: 'idx_in_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('instructor_notes', 'idx_in_created_at');
    await queryInterface.removeIndex('instructor_notes', 'idx_in_instructor');
    await queryInterface.removeIndex('instructor_notes', 'idx_in_target');
    await queryInterface.removeIndex('instructor_notes', 'idx_in_tenant_student');
    await queryInterface.dropTable('instructor_notes');
  },
};
