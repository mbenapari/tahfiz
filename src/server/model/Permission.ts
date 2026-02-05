import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface PermissionAttributes {
  id: number;
  name: string;
  slug: string; // e.g., 'user:create', 'attendance:edit'
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'description' | 'created_at' | 'updated_at'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare description: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
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
  },
  {
    sequelize,
    tableName: 'permissions',
    modelName: 'Permission',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Permission;
