import { Schema, Types } from "mongoose";

const UserSchema = new Schema({
  schoolId: {
    type: Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["student", "instructor", "admin"], 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default UserSchema;