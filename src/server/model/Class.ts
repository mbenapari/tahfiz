import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface ClassAttributes {
  id: number;
  tenant_id: number;
  name: string;
  slug: string;
  description?: string;
  grade_level?: string;
  instructor_id?: number;
  max_students?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface ClassCreationAttributes extends Optional<ClassAttributes, 'id' | 'description' | 'grade_level' | 'instructor_id' | 'max_students' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class Class extends Model<ClassAttributes, ClassCreationAttributes> implements ClassAttributes {
  declare id: number;
  declare tenant_id: number;
  declare name: string;
  declare slug: string;
  declare description: string;
  declare grade_level: string;
  declare instructor_id: number;
  declare max_students: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;

  // Associations
  declare students?: any[];
  declare instructor?: any;
}

Class.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    grade_level: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    instructor_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    max_students: {
      type: DataTypes.INTEGER,
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
    tableName: 'classes',
    modelName: 'Class',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_classes_tenant_id',
        fields: ['tenant_id'],
      },
      {
        name: 'idx_classes_instructor_id',
        fields: ['instructor_id'],
      },
    ],
  }
);

export default Class;
