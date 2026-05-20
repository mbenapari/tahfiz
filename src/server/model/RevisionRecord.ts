import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface RevisionRecordAttributes {
  id: number;
  tenant_id: number;
  session_id: number;
  student_id: number;
  instructor_id?: number;
  surah_number?: number;
  start_surah_number?: number;
  end_surah_number?: number;
  start_ayah?: number;
  end_ayah?: number;
  start_page?: number;
  end_page?: number;
  is_full_surah?: boolean;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface RevisionRecordCreationAttributes
  extends Optional<RevisionRecordAttributes, 'id' | 'instructor_id' | 'surah_number' | 'start_ayah' | 'end_ayah' | 'start_page' | 'end_page' | 'is_full_surah' | 'notes' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class RevisionRecord extends Model<RevisionRecordAttributes, RevisionRecordCreationAttributes> implements RevisionRecordAttributes {
  declare id: number;
  declare tenant_id: number;
  declare session_id: number;
  declare student_id: number;
  declare instructor_id: number;
  declare surah_number: number;
  declare start_surah_number: number;
  declare end_surah_number: number;
  declare start_ayah: number;
  declare end_ayah: number;
  declare start_page: number;
  declare end_page: number;
  declare is_full_surah: boolean;
  declare notes: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

RevisionRecord.init(
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
    session_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'sessions',
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
    instructor_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    surah_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'surahs',
        key: 'number',
      },
    },
    start_surah_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'surahs',
        key: 'number',
      },
    },
    end_surah_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'surahs',
        key: 'number',
      },
    },
    start_ayah: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    end_ayah: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_page: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    end_page: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: 'revision_records',
    modelName: 'RevisionRecord',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_revision_tenant_student',
        fields: ['tenant_id', 'student_id'],
      },
      {
        name: 'idx_revision_session',
        fields: ['session_id'],
      },
    ],
  }
);

export default RevisionRecord;
