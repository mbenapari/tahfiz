import { Schema, Types } from "mongoose";

const RevisionSchema = new Schema({
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
  pagesRevised: { 
    type: [Number], 
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.every(page => page >= 1 && page <= 604);
      },
      message: 'Page numbers must be between 1 and 604'
    }
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  notes: { 
    type: String 
  }
});

export default RevisionSchema;