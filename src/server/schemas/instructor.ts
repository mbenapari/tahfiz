import { Schema, Types } from "mongoose";

const InstructorSchema = new Schema({
  user_id: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  school_id: {
    type: Types.ObjectId,
    ref: 'School',
    required: true
  },
  assigned_students: [{
    type: Types.ObjectId,
    ref: 'Student',
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default InstructorSchema;