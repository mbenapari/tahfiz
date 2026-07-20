import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

/** Visibility controls for instructor notes */
export enum NoteVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

/** Target entity types for instructor notes */
export enum NoteTargetType {
  REVISION = 'revision',
  HIFZ = 'hifz',
  SESSION = 'session',
}

interface InstructorNoteAttributes {
  id: number;
  tenant_id: number;
  target_type: NoteTargetType;
  target_id: number;
  instructor_id: number;
  student_id: number;
  /** Rich-text content (HTML/Markdown) */
  content: string;
  visibility: NoteVisibility;
  /** Timestamped annotation reference (e.g., ayah:verse marker) */
  annotation_ref?: string | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface InstructorNoteCreationAttributes
  extends Optional<InstructorNoteAttributes, 'id' | 'annotation_ref' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class InstructorNote
  extends Model<InstructorNoteAttributes, InstructorNoteCreationAttributes>
  implements InstructorNoteAttributes
{
  declare id: number;
  declare tenant_id: number;
  declare target_type: NoteTargetType;
  declare target_id: number;
  declare instructor_id: number;
  declare student_id: number;
  declare content: string;
  declare visibility: NoteVisibility;
  declare annotation_ref: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

InstructorNote.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'schools', key: 'id' },
    },
    target_type: {
      type: DataTypes.ENUM(...Object.values(NoteTargetType)),
      allowNull: false,
    },
    target_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to revision_records.id, memorization_records.id, or sessions.id based on target_type',
    },
    instructor_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 10000],
      },
    },
    visibility: {
      type: DataTypes.ENUM(...Object.values(NoteVisibility)),
      allowNull: false,
      defaultValue: NoteVisibility.PRIVATE,
    },
    annotation_ref: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Timestamped reference e.g., "ayah:2:255" or "page:10:line:5"',
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
    tableName: 'instructor_notes',
    modelName: 'InstructorNote',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { name: 'idx_in_tenant_student', fields: ['tenant_id', 'student_id'] },
      { name: 'idx_in_target', fields: ['target_type', 'target_id'] },
      { name: 'idx_in_instructor', fields: ['instructor_id'] },
      { name: 'idx_in_created_at', fields: ['created_at'] },
    ],
  }
);

export default InstructorNote;
