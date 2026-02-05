import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface JuzMapAttributes {
  id: number;
  juz_number: number;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface JuzMapCreationAttributes extends Optional<JuzMapAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class JuzMap extends Model<JuzMapAttributes, JuzMapCreationAttributes> implements JuzMapAttributes {
  public id!: number;
  public juz_number!: number;
  public surah_number!: number;
  public start_ayah!: number;
  public end_ayah!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

JuzMap.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    juz_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    surah_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'surahs',
        key: 'number',
      },
    },
    start_ayah: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    end_ayah: {
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
    tableName: 'juz_map',
    modelName: 'JuzMap',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_juz_surah',
        fields: ['juz_number', 'surah_number'],
      },
    ],
  }
);

export default JuzMap;
