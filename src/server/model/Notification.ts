import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

/**
 * Interface for Notification attributes
 */
export interface NotificationAttributes {
  id: number;
  tenant_id: number;
  user_id: number;
  title: string;
  message: string;
  type: string; // e.g., 'info', 'success', 'warning', 'error'
  is_read: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

/**
 * Interface for Notification creation attributes
 */
export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'is_read' | 'created_at' | 'updated_at' | 'deleted_at'> {}

/**
 * Notification model for managing user alerts and updates
 */
class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: number;
  declare tenant_id: number;
  declare user_id: number;
  declare title: string;
  declare message: string;
  declare type: string;
  declare is_read: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

Notification.init(
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
        model: 'tenants',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'info',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: 'notifications',
    modelName: 'Notification',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_notif_user',
        fields: ['user_id'],
      },
      {
        name: 'idx_notif_tenant',
        fields: ['tenant_id'],
      },
      {
        name: 'idx_notif_is_read',
        fields: ['is_read'],
      },
    ],
  }
);

export default Notification;
