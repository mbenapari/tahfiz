import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import bcrypt from 'bcrypt';

interface SystemOwnerAttributes {
  id: number;
  name: string;
  email: string;
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
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
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
      },
      beforeUpdate: async (owner: SystemOwner) => {
        if ((owner as any).changed && (owner as any).changed('password') && owner.password) {
          const salt = await bcrypt.genSalt(12);
          owner.password = await bcrypt.hash(owner.password, salt);
        }
      }
    }
  }
);

export default SystemOwner;
