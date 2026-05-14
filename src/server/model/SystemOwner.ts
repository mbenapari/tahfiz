import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import bcrypt from 'bcrypt';
import { encrypt, decrypt, generateBlindIndex } from '../utils/crypto';

interface SystemOwnerAttributes {
  id: number;
  name: string;
  email: string;
  email_blind_index?: string;
  phone?: string | null;
  password?: string;
  role: 'sys_admin' | 'super';
  created_at?: Date;
  updated_at?: Date;
}

interface SystemOwnerCreationAttributes extends Optional<SystemOwnerAttributes, 'id' | 'phone' | 'created_at' | 'updated_at'> {}

class SystemOwner extends Model<SystemOwnerAttributes, SystemOwnerCreationAttributes> implements SystemOwnerAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare email_blind_index: string;
  declare phone: string | null;
  declare password: string;
  declare role: 'sys_admin' | 'super';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  public async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }
}

SystemOwner.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    role: {
      type: DataTypes.ENUM('sys_admin', 'super'),
      allowNull: false,
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
    tableName: 'system_owners',
    modelName: 'SystemOwner',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (owner: SystemOwner) => {
        if (owner.password) {
          const salt = await bcrypt.genSalt(12);
          owner.password = await bcrypt.hash(owner.password, salt);
        }
        // Encrypt PII
        if (owner.email) {
          owner.email_blind_index = generateBlindIndex(owner.email);
          owner.email = encrypt(owner.email);
        }
        if (owner.phone) owner.phone = encrypt(owner.phone);
      },
      beforeUpdate: async (owner: SystemOwner) => {
        if ((owner as any).changed && (owner as any).changed('password') && owner.password) {
          const salt = await bcrypt.genSalt(12);
          owner.password = await bcrypt.hash(owner.password, salt);
        }
        // Encrypt PII if changed
        if ((owner as any).changed && (owner as any).changed('email') && owner.email) {
          owner.email_blind_index = generateBlindIndex(owner.email);
          owner.email = encrypt(owner.email);
        }
        if ((owner as any).changed && (owner as any).changed('phone') && owner.phone) {
          owner.phone = encrypt(owner.phone);
        }
      },
      afterFind: (results: any) => {
        const decryptOwner = (o: any) => {
          if (o.email) o.email = decrypt(o.email);
          if (o.phone) o.phone = decrypt(o.phone);
        };

        if (Array.isArray(results)) {
          results.forEach(o => o && decryptOwner(o));
        } else if (results) {
          decryptOwner(results);
        }
      }
    }
  }
);

export default SystemOwner;
