import { Schema } from "mongoose";

const QuranSchema = new Schema({
  chapterNumber: { 
    type: Number, 
    required: true,
    min: 1,
    max: 114
  },
  chapterName: { 
    type: String, 
    required: true 
  },
  verses: { 
    type: Number, 
    required: true,
    min: 1
  },
  part: { 
    type: Number, 
    required: true,
    min: 1,
    max: 30
  },
  pages: { 
    type: [Number], 
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.every(page => page >= 1 && page <= 604);
      },
      message: 'Page numbers must be between 1 and 604'
    }
  }
});

export default QuranSchema;