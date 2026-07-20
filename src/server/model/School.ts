import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface SchoolAttributes {
  id: number;
  name: string;
  slug: string; // Add slug
  owner_id?: number;
  timezone: string;
  study_days: number[]; // Array of numbers representing days
  schedule_mode: 'simple' | 'advanced';
  session_type_day_map: Record<string, number[]> | null;
  enabled_memorization_subtypes: Array<{ key: string; label: string; active: boolean }> | null;
  start_time?: string;
  end_time?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  // NEW: Hierarchical fields for branch management
  parent_school_id: number | null;  // FK to parent School, null for root/parent schools
  is_branch: boolean;                // true = branch school, false = parent/root school
  branch_code: string | null;        // Unique code for branch identification
  is_active: boolean;               // Can be deactivated without deletion
  deactivated_at?: Date | null;     // When branch was deactivated
  // NEW: Inheritance Overrides (if null, branch inherits from parent_school)
  override_study_days?: number[] | null;
  override_schedule_mode?: 'simple' | 'advanced' | null;
  override_memorization_subtypes?: Array<{ key: string; label: string; active: boolean }> | null;
}

interface SchoolCreationAttributes extends Optional<SchoolAttributes, 'id' | 'owner_id' | 'timezone' | 'schedule_mode' | 'session_type_day_map' | 'enabled_memorization_subtypes' | 'start_time' | 'end_time' | 'email' | 'phone' | 'address' | 'created_at' | 'updated_at' | 'deleted_at' | 'parent_school_id' | 'is_branch' | 'branch_code' | 'is_active' | 'deactivated_at' | 'override_study_days' | 'override_schedule_mode' | 'override_memorization_subtypes'> {}

class School extends Model<SchoolAttributes, SchoolCreationAttributes> implements SchoolAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare owner_id: number;
  declare timezone: string;
  declare study_days: number[];
  declare schedule_mode: 'simple' | 'advanced';
  declare session_type_day_map: Record<string, number[]> | null;
  declare enabled_memorization_subtypes: Array<{ key: string; label: string; active: boolean }> | null;
  declare start_time: string;
  declare end_time: string;
  declare email: string;
  declare phone: string;
  declare address: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
  // NEW: Hierarchical fields
  declare parent_school_id: number | null;
  declare is_branch: boolean;
  declare branch_code: string | null;
  declare is_active: boolean;
  declare deactivated_at: Date | null;
  declare override_study_days: number[] | null;
  declare override_schedule_mode: 'simple' | 'advanced' | null;
  declare override_memorization_subtypes: Array<{ key: string; label: string; active: boolean }> | null;
}

School.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    owner_id: {
      type: DataTypes.BIGINT,
      allowNull: true, // Optional initially, or mandatory if created by user
      references: {
        model: 'users',
        key: 'id',
      },
    },
    timezone: {
      type: DataTypes.STRING(64),
      defaultValue: 'UTC',
    },
    study_days: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    schedule_mode: {
      type: DataTypes.STRING(20),
      defaultValue: 'simple',
      allowNull: false,
    },
    session_type_day_map: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    enabled_memorization_subtypes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    start_time: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    end_time: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // NEW: Hierarchical fields for branch management
    parent_school_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    is_branch: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    branch_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    deactivated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    override_study_days: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    override_schedule_mode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    override_memorization_subtypes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: 'tenants',
    modelName: 'School',
    paranoid: true, // This enables soft deletes (deleted_at)
    timestamps: true, // This enables created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_school_parent_id',
        fields: ['parent_school_id'],
      },
      {
        name: 'idx_school_is_branch',
        fields: ['is_branch'],
      },
      {
        name: 'idx_school_branch_code',
        fields: ['branch_code'],
      },
    ],
  }
);

export default School;
