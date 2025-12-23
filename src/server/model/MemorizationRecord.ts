import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import School from './School';
import Session from './Session';
import User from './User';
import Surah from './Surah';

export enum RecordType {
  MEMORIZED = 'memorized',
  REVISED = 'revised',
}

interface MemorizationRecordAttributes {
  id: number;
  tenant_id: number;
  session_id: number;
  student_id: number;
  instructor_id?: number;
  record_type: RecordType;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  is_full_surah?: boolean;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface MemorizationRecordCreationAttributes extends Optional<MemorizationRecordAttributes, 'id' | 'instructor_id' | 'is_full_surah' | 'notes' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class MemorizationRecord extends Model<MemorizationRecordAttributes, MemorizationRecordCreationAttributes> implements MemorizationRecordAttributes {
  public id!: number;
  public tenant_id!: number;
  public session_id!: number;
  public student_id!: number;
  public instructor_id!: number;
  public record_type!: RecordType;
  public surah_number!: number;
  public start_ayah!: number;
  public end_ayah!: number;
  public is_full_surah!: boolean;
  public notes!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

MemorizationRecord.init(
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
    session_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Session,
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
    instructor_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    record_type: {
      type: DataTypes.ENUM(...Object.values(RecordType)),
      allowNull: false,
    },
    surah_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Surah,
        key: 'number',
      },
    },
    start_ayah: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    end_ayah: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_full_surah: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.STRING(1024),
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
    tableName: 'memorization_records',
    modelName: 'MemorizationRecord',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_mem_tenant_student',
        fields: ['tenant_id', 'student_id'],
      },
      {
        name: 'idx_mem_session_type',
        fields: ['session_id', 'record_type'],
      },
    ],
  }
);

// Define Associations
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

export default MemorizationRecord;
