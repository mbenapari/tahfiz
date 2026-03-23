import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface SessionAttributes {
  id: number;
  tenant_id: number;
  student_id: number;
  instructor_id?: number;
  session_date: string; // Date only string
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
  declare notes: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

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
    ],
  }
);

export default Session;
