import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import { UserRole } from './User';

interface SchoolMemberAttributes {
  id: number;
  school_id: number;
  user_id: number;
  role: UserRole;
  created_at?: Date;
  updated_at?: Date;
}

interface SchoolMemberCreationAttributes extends Optional<SchoolMemberAttributes, 'id' | 'created_at' | 'updated_at'> {}

class SchoolMember extends Model<SchoolMemberAttributes, SchoolMemberCreationAttributes> implements SchoolMemberAttributes {
  declare id: number;
  declare school_id: number;
  declare user_id: number;
  declare role: UserRole;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

SchoolMember.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'schools',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.STUDENT,
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
    tableName: 'school_members',
    modelName: 'SchoolMember',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['school_id', 'user_id'],
      },
    ],
  }
);

export default SchoolMember;
