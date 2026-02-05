import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface SchoolAttributes {
  id: number;
  name: string;
  slug: string; // Add slug
  owner_id?: number;
  timezone: string;
  study_days: number[]; // Array of numbers representing days
  address?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface SchoolCreationAttributes extends Optional<SchoolAttributes, 'id' | 'owner_id' | 'timezone' | 'address' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class School extends Model<SchoolAttributes, SchoolCreationAttributes> implements SchoolAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare owner_id: number;
  declare timezone: string;
  declare study_days: number[];
  declare address: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

School.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    owner_id: {
      type: DataTypes.BIGINT,
      allowNull: true, // Optional initially, or mandatory if created by user
      references: {
        model: 'users',
        key: 'id',
      },
    },
    timezone: {
      type: DataTypes.STRING(64),
      defaultValue: 'UTC',
    },
    study_days: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
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
    tableName: 'tenants',
    modelName: 'School',
    paranoid: true, // This enables soft deletes (deleted_at)
    timestamps: true, // This enables created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default School;
