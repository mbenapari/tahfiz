import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';

export enum PermissionAccess {
  ALLOW = 'allow',
  DENY = 'deny',
}

interface UserPermissionAttributes {
  user_id: number;
  permission_id: number;
  access_type: PermissionAccess;
  created_at?: Date;
  updated_at?: Date;
}

class UserPermission extends Model<UserPermissionAttributes> implements UserPermissionAttributes {
  declare user_id: number;
  declare permission_id: number;
  declare access_type: PermissionAccess;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

UserPermission.init(
  {
    user_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      references: {
        model: 'users',
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
    access_type: {
      type: DataTypes.ENUM(...Object.values(PermissionAccess)),
      allowNull: false,
      defaultValue: PermissionAccess.ALLOW,
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
    tableName: 'user_permissions',
    modelName: 'UserPermission',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default UserPermission;
