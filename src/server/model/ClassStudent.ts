import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface ClassStudentAttributes {
  id: number;
  class_id: number;
  student_id: number;
  joined_on?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface ClassStudentCreationAttributes extends Optional<ClassStudentAttributes, 'id' | 'joined_on' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class ClassStudent extends Model<ClassStudentAttributes, ClassStudentCreationAttributes> implements ClassStudentAttributes {
  declare id: number;
  declare class_id: number;
  declare student_id: number;
  declare joined_on: Date;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;

  // Associations
  declare class?: any;
  declare student?: any;
}

ClassStudent.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'classes',
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
    joined_on: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    tableName: 'class_students',
    modelName: 'ClassStudent',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_class_students_unique',
        fields: ['class_id', 'student_id'],
        unique: true,
      },
      {
        name: 'idx_class_students_student_id',
        fields: ['student_id'],
      },
    ],
  }
);

export default ClassStudent;
