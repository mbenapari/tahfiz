import { Schema, Types } from "mongoose";

const AttendanceSchema = new Schema({
  schoolId: { 
    type: Types.ObjectId, 
    ref: "School", 
    required: true 
  },
  studentId: { 
    type: Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  instructorId: { 
    type: Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now, 
    required: true 
  },
  sessionType: { 
    type: String, 
    enum: ["memorization", "revision"], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["present", "absent"], 
    required: true 
  },
  notes: { 
    type: String 
  }
});

export default AttendanceSchema;