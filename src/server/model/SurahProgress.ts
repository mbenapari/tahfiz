import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import School from './School';
import User from './User';
import Surah from './Surah';

interface SurahProgressAttributes {
  id: number;
  tenant_id: number;
  student_id: number;
  surah_number: number;
  completed_on: string;
  read_full_count: number;
  last_read_on?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface SurahProgressCreationAttributes extends Optional<SurahProgressAttributes, 'id' | 'read_full_count' | 'last_read_on' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class SurahProgress extends Model<SurahProgressAttributes, SurahProgressCreationAttributes> implements SurahProgressAttributes {
  public id!: number;
  public tenant_id!: number;
  public student_id!: number;
  public surah_number!: number;
  public completed_on!: string;
  public read_full_count!: number;
  public last_read_on!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

SurahProgress.init(
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
    surah_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Surah,
        key: 'number',
      },
    },
    completed_on: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    read_full_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    last_read_on: {
      type: DataTypes.DATEONLY,
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
    tableName: 'surah_progress',
    modelName: 'SurahProgress',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        name: 'ux_student_surah',
        fields: ['student_id', 'surah_number'],
      },
    ],
  }
);

// Define Associations
School.hasMany(SurahProgress, { foreignKey: 'tenant_id', as: 'surah_progress_records' });
SurahProgress.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(SurahProgress, { foreignKey: 'student_id', as: 'surah_progress_records' });
SurahProgress.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

Surah.hasMany(SurahProgress, { foreignKey: 'surah_number', as: 'progress_records' });
SurahProgress.belongsTo(Surah, { foreignKey: 'surah_number', as: 'surah' });

export default SurahProgress;
