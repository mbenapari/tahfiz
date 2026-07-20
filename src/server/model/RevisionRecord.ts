import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

/** Standardized performance rating levels for revision sessions */
export enum RevisionRating {
  VERY_POOR = 1,
  POOR = 2,
  AVERAGE = 3,
  GOOD = 4,
  EXCELLENT = 5,
}

/** Human-readable descriptions for each rating level */
export const REVISION_RATING_LABELS: Record<RevisionRating, string> = {
  [RevisionRating.VERY_POOR]: 'Very Poor - Major errors, unable to recall',
  [RevisionRating.POOR]: 'Poor - Frequent mistakes, needs significant prompting',
  [RevisionRating.AVERAGE]: 'Average - Some errors, moderate fluency',
  [RevisionRating.GOOD]: 'Good - Minor errors, good fluency',
  [RevisionRating.EXCELLENT]: 'Excellent - Flawless recitation, perfect tajweed',
};

/** Detailed criteria for each rating level */
export const REVISION_RATING_CRITERIA: Record<RevisionRating, string> = {
  [RevisionRating.VERY_POOR]: '5+ errors per page; cannot continue without constant correction; poor pronunciation',
  [RevisionRating.POOR]: '3-4 errors per page; requires frequent prompting; inconsistent tajweed',
  [RevisionRating.AVERAGE]: '1-2 errors per page; needs occasional prompting; acceptable fluency',
  [RevisionRating.GOOD]: 'Minor errors (1 per 3-5 pages); mostly self-correcting; good fluency and tajweed',
  [RevisionRating.EXCELLENT]: 'No errors; perfect tajweed and fluency; confident recitation',
};

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
  rating?: number;
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
  declare rating: number;
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3,
      validate: { min: 1, max: 5 },
      comment: 'Revision performance rating (1-5 scale)',
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
