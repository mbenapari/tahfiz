import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

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
  declare id: number;
  declare tenant_id: number;
  declare student_id: number;
  declare surah_number: number;
  declare completed_on: string;
  declare read_full_count: number;
  declare last_read_on: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
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
    surah_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'surahs',
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

export default SurahProgress;
