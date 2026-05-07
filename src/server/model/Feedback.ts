import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

export enum FeedbackStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum FeedbackCategory {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  GENERAL = 'general',
  UX = 'ux',
  OTHER = 'other',
}

interface FeedbackAttributes {
  id: number;
  user_id: number;
  tenant_id?: number | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  admin_notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface FeedbackCreationAttributes extends Optional<FeedbackAttributes, 'id' | 'tenant_id' | 'status' | 'admin_notes' | 'created_at' | 'updated_at'> {}

class Feedback extends Model<FeedbackAttributes, FeedbackCreationAttributes> implements FeedbackAttributes {
  declare id: number;
  declare user_id: number;
  declare tenant_id: number | null;
  declare category: FeedbackCategory;
  declare subject: string;
  declare message: string;
  declare status: FeedbackStatus;
  declare admin_notes: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Associations
  declare user?: any;
  declare tenant?: any;
}

Feedback.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    tenant_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    category: {
      type: DataTypes.ENUM(...Object.values(FeedbackCategory)),
      allowNull: false,
      defaultValue: FeedbackCategory.GENERAL,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(FeedbackStatus)),
      allowNull: false,
      defaultValue: FeedbackStatus.PENDING,
    },
    admin_notes: {
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
    tableName: 'feedbacks',
    modelName: 'Feedback',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Feedback;
