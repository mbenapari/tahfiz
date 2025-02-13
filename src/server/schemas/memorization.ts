import { Schema, Types } from "mongoose";

const MemorizationSchema = new Schema({
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
  chapterNumber: { 
    type: Number, 
    required: true,
    min: 1,
    max: 114
  },
  startVerse: { 
    type: Number, 
    required: true,
    min: 1
  },
  endVerse: { 
    type: Number, 
    required: true,
    min: 1
  },
  pagesCovered: { 
    type: [Number],
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
  }
});

export default MemorizationSchema;