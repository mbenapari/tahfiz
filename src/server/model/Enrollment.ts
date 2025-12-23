import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import School from './School';
import User from './User';

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
  public id!: number;
  public tenant_id!: number;
  public student_id!: number;
  public enrolled_on!: string;
  public status!: EnrollmentStatus;
  public notes!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
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
        model: School,
        key: 'id',
      },
    },
    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
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

// Define Associations
School.hasMany(Enrollment, { foreignKey: 'tenant_id', as: 'enrollments' });
Enrollment.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

export default Enrollment;
