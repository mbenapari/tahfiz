import School from './School';
import User from './User';
import Enrollment from './Enrollment';
import Attendance from './Attendance';
import Session from './Session';
import MemorizationRecord from './MemorizationRecord';
import Surah from './Surah';
import JuzMap from './JuzMap';
import SurahProgress from './SurahProgress';
import JuzProgress from './JuzProgress';
import Role from './Role';
import Permission from './Permission';
import RolePermission from './RolePermission';
import UserPermission from './UserPermission';
import SchoolMember from './SchoolMember';

// Associations

// School (Tenant) <-> User (Owner)
School.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
User.hasMany(School, { foreignKey: 'owner_id', as: 'ownedSchools' });

// School <-> User (Direct tenant relationship)
User.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });
School.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });

// School <-> User (Many-to-Many via SchoolMember)
School.belongsToMany(User, { through: SchoolMember, foreignKey: 'school_id', as: 'members' });
User.belongsToMany(School, { through: SchoolMember, foreignKey: 'user_id', as: 'schools' });
School.hasMany(SchoolMember, { foreignKey: 'school_id' });
SchoolMember.belongsTo(School, { foreignKey: 'school_id' });
User.hasMany(SchoolMember, { foreignKey: 'user_id' });
SchoolMember.belongsTo(User, { foreignKey: 'user_id' });

// Enrollment Associations
School.hasMany(Enrollment, { foreignKey: 'tenant_id', as: 'enrollments' });
Enrollment.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Session Associations
School.hasMany(Session, { foreignKey: 'tenant_id', as: 'sessions' });
Session.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(Session, { foreignKey: 'student_id', as: 'student_sessions' });
Session.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

User.hasMany(Session, { foreignKey: 'instructor_id', as: 'instructor_sessions' });
Session.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

// Attendance Associations
Session.hasOne(Attendance, { foreignKey: 'session_id', as: 'attendance' });
Attendance.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

User.hasMany(Attendance, { foreignKey: 'recorded_by', as: 'recorded_attendances' });
Attendance.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });

// MemorizationRecord Associations
School.hasMany(MemorizationRecord, { foreignKey: 'tenant_id', as: 'memorization_records' });
MemorizationRecord.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });

Session.hasMany(MemorizationRecord, { foreignKey: 'session_id', as: 'memorization_records' });
MemorizationRecord.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

User.hasMany(MemorizationRecord, { foreignKey: 'student_id', as: 'student_memorization_records' });
MemorizationRecord.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

User.hasMany(MemorizationRecord, { foreignKey: 'instructor_id', as: 'instructor_memorization_records' });
MemorizationRecord.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

Surah.hasMany(MemorizationRecord, { foreignKey: 'surah_number', as: 'memorization_records' });
MemorizationRecord.belongsTo(Surah, { foreignKey: 'surah_number', as: 'surah' });

// JuzProgress Associations
School.hasMany(JuzProgress, { foreignKey: 'tenant_id', as: 'juz_progress_records' });
JuzProgress.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(JuzProgress, { foreignKey: 'student_id', as: 'juz_progress_records' });
JuzProgress.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// SurahProgress Associations
School.hasMany(SurahProgress, { foreignKey: 'tenant_id', as: 'surah_progress_records' });
SurahProgress.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(SurahProgress, { foreignKey: 'student_id', as: 'surah_progress_records' });
SurahProgress.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

Surah.hasMany(SurahProgress, { foreignKey: 'surah_number', as: 'progress_records' });
SurahProgress.belongsTo(Surah, { foreignKey: 'surah_number', as: 'surah' });

// JuzMap Associations
Surah.hasMany(JuzMap, { foreignKey: 'surah_number', as: 'juz_maps' });
JuzMap.belongsTo(Surah, { foreignKey: 'surah_number', as: 'surah' });

// Role & Permissions
Role.belongsToMany(Permission, { 
  through: RolePermission, 
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions' 
});
Permission.belongsToMany(Role, { 
  through: RolePermission, 
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles' 
});

// User & Role
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role_obj' });

// User & Permissions (Overrides)
User.belongsToMany(Permission, { 
  through: UserPermission, 
  foreignKey: 'user_id',
  otherKey: 'permission_id',
  as: 'permission_overrides' 
});
Permission.belongsToMany(User, { 
  through: UserPermission, 
  foreignKey: 'permission_id',
  otherKey: 'user_id',
  as: 'users_with_overrides' 
});

// Explicit associations for UserPermission model usage in 'include' queries
UserPermission.belongsTo(Permission, { foreignKey: 'permission_id' });
Permission.hasMany(UserPermission, { foreignKey: 'permission_id' });

export {
  School,
  User,
  Enrollment,
  Attendance,
  Session,
  MemorizationRecord,
  Surah,
  JuzMap,
  SurahProgress,
  JuzProgress,
  Role,
  Permission,
  RolePermission,
  UserPermission,
  SchoolMember
};
