import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  COMPLETED = 'completed',
  LEFT = 'left',
}

interface EnrollmentAttributes {
  id: number;
  tenant_id: number;
  student_id: number;
  enrolled_on?: string; // Date only string or Date object
  status: EnrollmentStatus;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface EnrollmentCreationAttributes extends Optional<EnrollmentAttributes, 'id' | 'enrolled_on' | 'status' | 'notes' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class Enrollment extends Model<EnrollmentAttributes, EnrollmentCreationAttributes> implements EnrollmentAttributes {
  declare id: number;
  declare tenant_id: number;
  declare student_id: number;
  declare enrolled_on: string;
  declare status: EnrollmentStatus;
  declare notes: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

Enrollment.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'schools',
        key: 'id',
      },
    },
    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    enrolled_on: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EnrollmentStatus)),
      defaultValue: EnrollmentStatus.ACTIVE,
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: 'enrollments',
    modelName: 'Enrollment',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_enroll_tenant_student',
        fields: ['tenant_id', 'student_id'],
      },
    ],
  }
);

export default Enrollment;
