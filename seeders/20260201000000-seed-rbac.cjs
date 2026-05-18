'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Seed Roles
    const roles = [
      { name: 'Admin', slug: 'admin', description: 'Institution Administrator', created_at: now, updated_at: now },
      { name: 'Instructor', slug: 'instructor', description: 'Teacher/Instructor', created_at: now, updated_at: now },
      { name: 'Student', slug: 'student', description: 'Student', created_at: now, updated_at: now },
      { name: 'Super Admin', slug: 'super_admin', description: 'System-wide Super Admin', created_at: now, updated_at: now },
    ];

    for (const r of roles) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE slug = :slug`,
        { replacements: { slug: r.slug }, type: Sequelize.QueryTypes.SELECT }
      );
      if (!existing) {
        await queryInterface.bulkInsert('roles', [r]);
      }
    }

    // 2. Seed Permissions
    const permissions = [
      { name: 'View Dashboard', slug: 'dashboard:view', description: 'Can view dashboard', created_at: now, updated_at: now },
      { name: 'Manage Users', slug: 'users:manage', description: 'Can create/edit/delete users', created_at: now, updated_at: now },
      { name: 'Edit Attendance', slug: 'attendance:edit', description: 'Can mark attendance', created_at: now, updated_at: now },
      { name: 'View Reports', slug: 'reports:view', description: 'Can view reports', created_at: now, updated_at: now },
      { name: 'Create/Edit Students', slug: 'student:write', description: 'Can create or update student records', created_at: now, updated_at: now },
      { name: 'Delete Students', slug: 'student:delete', description: 'Can delete student records', created_at: now, updated_at: now },
      { name: 'Create/Edit Instructors', slug: 'instructor:write', description: 'Can create or update instructor records', created_at: now, updated_at: now },
      { name: 'Delete Instructors', slug: 'instructor:delete', description: 'Can delete instructor records', created_at: now, updated_at: now },
    ];

    for (const p of permissions) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM permissions WHERE slug = :slug`,
        { replacements: { slug: p.slug }, type: Sequelize.QueryTypes.SELECT }
      );
      if (!existing) {
        await queryInterface.bulkInsert('permissions', [p]);
      }
    }

    // 3. Assign Permissions
    const [rolesData] = await queryInterface.sequelize.query('SELECT id, slug FROM roles');
    const [permsData] = await queryInterface.sequelize.query('SELECT id, slug FROM permissions');

    const roleMap = rolesData.reduce((acc, r) => ({ ...acc, [r.slug]: r.id }), {});
    const permMap = permsData.reduce((acc, p) => ({ ...acc, [p.slug]: p.id }), {});

    const rolePermissions = [];

    // Admin and Super Admin get all permissions
    ['admin', 'super_admin'].forEach(roleSlug => {
      if (roleMap[roleSlug]) {
        permsData.forEach(p => {
          rolePermissions.push({ role_id: roleMap[roleSlug], permission_id: p.id, created_at: now });
        });
      }
    });

    // Instructor gets specific
    if (roleMap['instructor']) {
      ['dashboard:view', 'attendance:edit', 'reports:view'].forEach(slug => {
        if (permMap[slug]) {
          rolePermissions.push({ role_id: roleMap['instructor'], permission_id: permMap[slug], created_at: now });
        }
      });
    }

    // Student gets specific
    if (roleMap['student']) {
      ['dashboard:view'].forEach(slug => {
        if (permMap[slug]) {
          rolePermissions.push({ role_id: roleMap['student'], permission_id: permMap[slug], created_at: now });
        }
      });
    }

    for (const rp of rolePermissions) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT role_id FROM role_permissions WHERE role_id = :role_id AND permission_id = :permission_id`,
        { 
          replacements: { role_id: rp.role_id, permission_id: rp.permission_id }, 
          type: Sequelize.QueryTypes.SELECT 
        }
      );
      if (!existing) {
        await queryInterface.bulkInsert('role_permissions', [rp]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
