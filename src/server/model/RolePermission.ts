import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';

interface RolePermissionAttributes {
  role_id: number;
  permission_id: number;
  created_at?: Date;
}

class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
  declare role_id: number;
  declare permission_id: number;
  declare readonly created_at: Date;
}

RolePermission.init(
  {
    role_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    permission_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    modelName: 'RolePermission',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
  }
);

export default RolePermission;
