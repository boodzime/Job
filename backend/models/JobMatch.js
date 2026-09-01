import mongoose from 'mongoose';

const jobMatchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cvId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CV',
    required: true
  },
  jobId: {
    type: String,
    required: true
  },
  jobTitle: String,
  company: String,
  location: String,
  salary: String,
  jobDescription: String,
  
  // Match Analysis
  matchPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  atsScore: {
    type: Number,
    min: 0,
    max: 100
  },
  matchReasons: [String],
  missingRequirements: [String],
  suggestedSkills: [String],
  
  // Fit Scores
  salaryFitScore: Number,
  cultureFitScore: Number,
  locationFitScore: Number,
  
  // Application Status
  status: {
    type: String,
    enum: ['recommended', 'interested', 'applied', 'interviewed', 'rejected', 'offer'],
    default: 'recommended'
  },
  
  // Timestamps
  recommendedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const JobMatch = mongoose.model('JobMatch', jobMatchSchema);
export default JobMatch;
