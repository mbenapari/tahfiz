'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_tenant_student_date
      ON sessions (tenant_id, student_id, session_date);
    `);

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION fn_check_mutual_exclusivity(
          p_tenant_id BIGINT,
          p_student_id BIGINT,
          p_session_date DATE,
          p_session_type VARCHAR
        )
        RETURNS BOOLEAN
        AS $$
        DECLARE
          has_memorization BOOLEAN := FALSE;
          has_revision BOOLEAN := FALSE;
        BEGIN
          SELECT EXISTS (
            SELECT 1
            FROM sessions s
            INNER JOIN memorization_records mr ON mr.session_id = s.id
            WHERE s.tenant_id = p_tenant_id
              AND s.student_id = p_student_id
              AND s.session_date = p_session_date
              AND s.deleted_at IS NULL
              AND mr.deleted_at IS NULL
              AND mr.record_type = 'memorized'
          ) INTO has_memorization;

          SELECT EXISTS (
            SELECT 1
            FROM sessions s
            INNER JOIN revision_records rr ON rr.session_id = s.id
            WHERE s.tenant_id = p_tenant_id
              AND s.student_id = p_student_id
              AND s.session_date = p_session_date
              AND s.deleted_at IS NULL
              AND rr.deleted_at IS NULL
          ) INTO has_revision;

          IF p_session_type = 'revision' THEN
            RETURN has_memorization;
          END IF;

          IF p_session_type LIKE 'memorization%' THEN
            RETURN has_revision;
          END IF;

          RETURN has_memorization OR has_revision;
        END;
        $$ LANGUAGE plpgsql;
      `);
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_sessions_tenant_student_date;
    `);

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        DROP FUNCTION IF EXISTS fn_check_mutual_exclusivity(BIGINT, BIGINT, DATE, VARCHAR);
      `);
    }
  },
};
