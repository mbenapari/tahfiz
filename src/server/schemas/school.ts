import { Schema, Types } from "mongoose";

const SchoolSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  address: { 
    type: String 
  },
  contact: { 
    type: String 
  },
  adminId: { 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  attendanceDays: { 
    type: [String], 
    default: ["Monday", "Tuesday", "Wednesday"] 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default SchoolSchema;