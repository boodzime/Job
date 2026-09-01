import mongoose from 'mongoose';

const cvSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: Number,
  mimeType: String,
  // Extracted Data
  extractedData: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    summary: String,
    experience: [{
      company: String,
      position: String,
      startDate: String,
      endDate: String,
      description: String,
      achievements: [String]
    }],
    education: [{
      school: String,
      degree: String,
      field: String,
      graduationYear: String
    }],
    skills: [String],
    languages: [String],
    certifications: [String],
    projects: [{
      title: String,
      description: String,
      technologies: [String],
      link: String
    }]
  },
  // AI Analysis Results
  aiAnalysis: {
    atsScore: {
      type: Number,
      min: 0,
      max: 100
    },
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    suggestedSkills: [String],
    jobMatches: [{
      jobId: String,
      matchPercentage: Number,
      reasons: [String]
    }],
    personalizedAdvice: String,
    analyzedAt: Date
  },
  // Metadata
  analysisCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

const CV = mongoose.model('CV', cvSchema);
export default CV;
