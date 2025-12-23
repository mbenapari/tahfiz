import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface SurahAttributes {
  number: number;
  name: string;
  ayah_count: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface SurahCreationAttributes extends Optional<SurahAttributes, 'created_at' | 'updated_at' | 'deleted_at'> {}

class Surah extends Model<SurahAttributes, SurahCreationAttributes> implements SurahAttributes {
  public number!: number;
  public name!: string;
  public ayah_count!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

Surah.init(
  {
    number: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    ayah_count: {
      type: DataTypes.INTEGER,
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
    deleted_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: 'surahs',
    modelName: 'Surah',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Surah;
