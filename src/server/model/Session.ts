import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import School from './School';

interface SessionAttributes {
  id: number;
  tenant_id: number;
  student_id: number;
  instructor_id?: number;
  session_date: string; // Date only string
  recording_date?: string; // Date only string
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface SessionCreationAttributes extends Optional<SessionAttributes, 'id' | 'instructor_id' | 'notes' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  declare id: number;
  declare tenant_id: number;
  declare student_id: number;
  declare instructor_id: number;
  declare session_date: string;
  declare recording_date: string;
  declare notes: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

const validateSessionCalendarAlignment = async (session: Session, options?: unknown) => {
  if (!(options as { validateScheduleAlignment?: boolean } | undefined)?.validateScheduleAlignment) {
    return;
  }

  const recordingDate = session.recording_date || session.session_date;
  if (!recordingDate || !session.tenant_id) {
    return;
  }

  const school = await School.findByPk(session.tenant_id);
  if (!school) {
    throw new Error('School not found for schedule validation.');
  }

  const { ScheduleService } = await import('../services/scheduleService');
  const validation = ScheduleService.validateSchoolCalendarDate(school, recordingDate, 'session-model-hook');
  if (!validation.isValid) {
    const error = new Error(validation.error || 'Session date is outside the school calendar.');
    (error as any).code = validation.code;
    (error as any).details = validation.details;
    throw error;
  }
};

Session.init(
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
    instructor_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    session_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    recording_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    tableName: 'sessions',
    modelName: 'Session',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        name: 'ux_student_date',
        fields: ['student_id', 'session_date'],
      },
      {
        name: 'idx_sessions_tenant_date',
        fields: ['tenant_id', 'session_date'],
      },
      {
        name: 'idx_sessions_student_id',
        fields: ['student_id'],
      },
      {
        name: 'idx_sessions_tenant_id',
        fields: ['tenant_id'],
      },
      {
        name: 'idx_sessions_date',
        fields: ['session_date'],
      },
    ],
    hooks: {
      beforeCreate: validateSessionCalendarAlignment,
      beforeUpdate: validateSessionCalendarAlignment,
    },
  }
);

export default Session;
