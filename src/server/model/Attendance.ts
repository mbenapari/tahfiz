import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  EXCUSED = 'excused',
}

interface AttendanceAttributes {
  id: number;
  session_id: number;
  status: AttendanceStatus;
  recorded_by?: number;
  recorded_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id' | 'status' | 'recorded_by' | 'recorded_at' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  public id!: number;
  public session_id!: number;
  public status!: AttendanceStatus;
  public recorded_by!: number;
  public readonly recorded_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

Attendance.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AttendanceStatus)),
      defaultValue: AttendanceStatus.PRESENT,
    },
    recorded_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    recorded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    tableName: 'attendance',
    modelName: 'Attendance',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Attendance;
