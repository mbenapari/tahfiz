import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import bcrypt from 'bcrypt';
import { encrypt, decrypt, generateBlindIndex } from '../utils/crypto';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

interface UserAttributes {
  id: number;
  tenant_id?: number;
  role_id?: number;
  first_name: string;
  last_name?: string;
  email?: string;
  email_blind_index?: string;
  password?: string;
  phone?: string;
  role: UserRole;
  student_identifier?: string;
  grade_level?: string;
  class_name?: string;
  is_onboarded: boolean;
  last_login_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'tenant_id' | 'role_id' | 'last_name' | 'email' | 'password' | 'phone' | 'student_identifier' | 'grade_level' | 'class_name' | 'is_onboarded' | 'last_login_at' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare tenant_id: number;
  declare role_id: number;
  declare first_name: string;
  declare last_name: string;
  declare email: string;
  declare email_blind_index: string;
  declare password: string;
  declare phone: string;
  declare role: UserRole;
  declare student_identifier: string;
  declare grade_level: string;
  declare class_name: string;
  declare is_onboarded: boolean;
  declare last_login_at: Date;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;

  // Associations
  declare tenant?: any; // Will be School instance
  declare ownedSchools?: any[];
  declare schools?: any[];

  // Instance method to validate password
  public async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }
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
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    role_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
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
      unique: true,
    },
    email_blind_index: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_onboarded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
    },
    student_identifier: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    grade_level: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    class_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_login_at: {
      type: DataTypes.DATE,
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
        name: 'idx_users_role',
        fields: ['role'],
      },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
        // Encrypt PII fields
        if (user.email) {
          user.email_blind_index = generateBlindIndex(user.email);
          user.email = encrypt(user.email);
        }
        if (user.phone) user.phone = encrypt(user.phone);
        if (user.student_identifier) user.student_identifier = encrypt(user.student_identifier);
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
        // Encrypt PII fields if changed
        if (user.changed('email') && user.email) {
          user.email_blind_index = generateBlindIndex(user.email);
          user.email = encrypt(user.email);
        }
        if (user.changed('phone') && user.phone) {
          user.phone = encrypt(user.phone);
        }
        if (user.changed('student_identifier') && user.student_identifier) {
          user.student_identifier = encrypt(user.student_identifier);
        }
      },
      afterFind: (results: any) => {
        const decryptUser = (u: any) => {
          if (u.email) u.email = decrypt(u.email);
          if (u.phone) u.phone = decrypt(u.phone);
          if (u.student_identifier) u.student_identifier = decrypt(u.student_identifier);
        };

        if (Array.isArray(results)) {
          results.forEach(u => u && decryptUser(u));
        } else if (results) {
          decryptUser(results);
        }
      }
    },
  }
);

export default User;
