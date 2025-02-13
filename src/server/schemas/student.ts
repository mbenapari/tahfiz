import { Schema, Types } from "mongoose";

const StudentSchema = new Schema({
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
  guardian_name: {
    type: String,
    required: true
  },
  guardian_contact: {
    type: String,
    required: true
  },
  memorization_level: {
    type: String,
    required: true,
    enum: [
      'Juz 1', 'Juz 2', 'Juz 3', 'Juz 4', 'Juz 5',
      'Juz 6', 'Juz 7', 'Juz 8', 'Juz 9', 'Juz 10',
      'Juz 11', 'Juz 12', 'Juz 13', 'Juz 14', 'Juz 15',
      'Juz 16', 'Juz 17', 'Juz 18', 'Juz 19', 'Juz 20',
      'Juz 21', 'Juz 22', 'Juz 23', 'Juz 24', 'Juz 25',
      'Juz 26', 'Juz 27', 'Juz 28', 'Juz 29', 'Juz 30'
    ]
  },
  revision_pages_per_day: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default StudentSchema;