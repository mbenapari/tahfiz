import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import School from './School';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

interface UserAttributes {
  id: number;
  tenant_id: number;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  student_identifier?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'last_name' | 'email' | 'phone' | 'student_identifier' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public tenant_id!: number;
  public first_name!: string;
  public last_name!: string;
  public email!: string;
  public phone!: string;
  public role!: UserRole;
  public student_identifier!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

User.init(
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
    first_name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
    },
    student_identifier: {
      type: DataTypes.STRING(100),
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
    tableName: 'users',
    modelName: 'User',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_users_tenant_role',
        fields: ['tenant_id', 'role'],
      },
    ],
  }
);

// Define Association
School.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(School, { foreignKey: 'tenant_id', as: 'tenant' });

export default User;
