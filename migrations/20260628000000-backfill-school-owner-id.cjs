'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Backfill owner_id for parent schools (is_branch = false) where owner_id IS NULL
    // The creator is identified by the user whose tenant_id matches the school's id
    // (the createSchool controller sets user.tenant_id = newSchool.id)
    await queryInterface.sequelize.query(`
      UPDATE tenants
      SET owner_id = subquery.user_id
      FROM (
        SELECT DISTINCT ON (u.tenant_id)
          u.tenant_id AS school_id,
          u.id AS user_id
        FROM users u
        WHERE u.tenant_id IS NOT NULL
        ORDER BY u.tenant_id, u.created_at ASC
      ) AS subquery
      WHERE tenants.id = subquery.school_id
        AND tenants.owner_id IS NULL
        AND tenants.is_branch = false
    `);

    // Backfill owner_id for branches — inherit from parent school's owner_id
    await queryInterface.sequelize.query(`
      UPDATE tenants AS branch
      SET owner_id = parent.owner_id
      FROM tenants AS parent
      WHERE branch.parent_school_id = parent.id
        AND branch.is_branch = true
        AND branch.owner_id IS NULL
        AND parent.owner_id IS NOT NULL
    `);
  },

  async down(queryInterface) {
    // No reverse operation — we don't set back to null as that would be data loss
  },
};
