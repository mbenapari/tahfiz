import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface JuzProgressAttributes {
  id: number;
  tenant_id: number;
  student_id: number;
  juz_number: number;
  completed_on?: string;
  full_reads: number;
  last_read_on?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface JuzProgressCreationAttributes extends Optional<JuzProgressAttributes, 'id' | 'completed_on' | 'full_reads' | 'last_read_on' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class JuzProgress extends Model<JuzProgressAttributes, JuzProgressCreationAttributes> implements JuzProgressAttributes {
  declare id: number;
  declare tenant_id: number;
  declare student_id: number;
  declare juz_number: number;
  declare completed_on: string;
  declare full_reads: number;
  declare last_read_on: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

JuzProgress.init(
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
    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    juz_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    completed_on: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    full_reads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_read_on: {
      type: DataTypes.DATEONLY,
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
    tableName: 'juz_progress',
    modelName: 'JuzProgress',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        name: 'ux_student_juz',
        fields: ['student_id', 'juz_number'],
      },
    ],
  }
);

export default JuzProgress;
