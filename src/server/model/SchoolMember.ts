import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import { UserRole } from './User';

interface SchoolMemberAttributes {
  id: number;
  school_id: number;
  user_id: number;
  role: UserRole;
  created_at?: Date;
  updated_at?: Date;
  // NEW: Scope control
  scope_type: 'school' | 'branch' | 'all';  // Defines membership scope
  is_primary_admin: boolean;                 // For branch admins managing their branch
  // NEW: Audit fields
  granted_by_user_id: number | null;         // Who granted this membership
  granted_at: Date | null;                   // When membership was granted
}

interface SchoolMemberCreationAttributes extends Optional<SchoolMemberAttributes, 'id' | 'created_at' | 'updated_at' | 'scope_type' | 'is_primary_admin' | 'granted_by_user_id' | 'granted_at'> {}

class SchoolMember extends Model<SchoolMemberAttributes, SchoolMemberCreationAttributes> implements SchoolMemberAttributes {
  declare id: number;
  declare school_id: number;
  declare user_id: number;
  declare role: UserRole;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  // NEW: Scope control
  declare scope_type: 'school' | 'branch' | 'all';
  declare is_primary_admin: boolean;
  // NEW: Audit fields
  declare granted_by_user_id: number | null;
  declare granted_at: Date | null;
}

SchoolMember.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'schools',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.STUDENT,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // NEW: Scope control
    scope_type: {
      type: DataTypes.ENUM('school', 'branch', 'all'),
      allowNull: false,
      defaultValue: 'school',
    },
    is_primary_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // NEW: Audit fields
    granted_by_user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    granted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'school_members',
    modelName: 'SchoolMember',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['school_id', 'user_id'],
      },
      {
        name: 'idx_school_member_scope',
        fields: ['scope_type'],
      },
      {
        name: 'idx_school_member_granted_by',
        fields: ['granted_by_user_id'],
      },
    ],
  }
);

export default SchoolMember;
