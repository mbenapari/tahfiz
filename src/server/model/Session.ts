import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import School from './School';
import User from './User';

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
  public id!: number;
  public tenant_id!: number;
  public student_id!: number;
  public instructor_id!: number;
  public session_date!: string;
  public notes!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
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
    instructor_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: User,
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

// Define Associations
School.hasMany(Session, { foreignKey: 'tenant_id', as: 'sessions' });
Session.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(Session, { foreignKey: 'student_id', as: 'student_sessions' });
Session.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

User.hasMany(Session, { foreignKey: 'instructor_id', as: 'instructor_sessions' });
Session.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

export default Session;
