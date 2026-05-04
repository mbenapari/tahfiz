'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Indexes for sessions table
    await queryInterface.addIndex('sessions', ['student_id'], {
      name: 'idx_sessions_student_id',
    });
    await queryInterface.addIndex('sessions', ['tenant_id'], {
      name: 'idx_sessions_tenant_id',
    });
    await queryInterface.addIndex('sessions', ['session_date'], {
      name: 'idx_sessions_date',
    });

    // Indexes for memorization_records table
    await queryInterface.addIndex('memorization_records', ['student_id'], {
      name: 'idx_mem_student_id',
    });
    await queryInterface.addIndex('memorization_records', ['tenant_id'], {
      name: 'idx_mem_tenant_id',
    });
    await queryInterface.addIndex('memorization_records', ['surah_number'], {
      name: 'idx_mem_surah_number',
    });
    await queryInterface.addIndex('memorization_records', ['created_at'], {
      name: 'idx_mem_created_at',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('sessions', 'idx_sessions_student_id');
    await queryInterface.removeIndex('sessions', 'idx_sessions_tenant_id');
    await queryInterface.removeIndex('sessions', 'idx_sessions_date');
    await queryInterface.removeIndex('memorization_records', 'idx_mem_student_id');
    await queryInterface.removeIndex('memorization_records', 'idx_mem_tenant_id');
    await queryInterface.removeIndex('memorization_records', 'idx_mem_surah_number');
    await queryInterface.removeIndex('memorization_records', 'idx_mem_created_at');
  }
};
