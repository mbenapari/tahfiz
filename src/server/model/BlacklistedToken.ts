import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface BlacklistedTokenAttributes {
  id: number;
  token: string;
  expires_at: Date;
}

interface BlacklistedTokenCreationAttributes extends Optional<BlacklistedTokenAttributes, 'id'> {}

class BlacklistedToken extends Model<BlacklistedTokenAttributes, BlacklistedTokenCreationAttributes> implements BlacklistedTokenAttributes {
  declare id: number;
  declare token: string;
  declare expires_at: Date;
}

BlacklistedToken.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'blacklisted_tokens',
    modelName: 'BlacklistedToken',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['token'],
      },
    ],
  }
);

export default BlacklistedToken;
