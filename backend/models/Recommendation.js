import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cvId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CV'
  },
  
  // Email Content
  emailSubject: String,
  emailContent: {
    greeting: String,
    introduction: String,
    jobRecommendations: String,
    applicationAdvice: String,
    closingAdvice: String,
    signature: String
  },
  
  // Recommended Jobs
  recommendedJobs: [{
    jobId: String,
    title: String,
    company: String,
    matchPercentage: Number,
    reason: String,
    url: String
  }],
  
  // Personalized Advice
  careerGuidance: String,
  nextSteps: [String],
  skillsToFocus: [String],
  
  // Tracking
  emailSentAt: Date,
  emailOpenedAt: Date,
  emailClickedAt: Date,
  jobsViewed: [String],
  jobsAppliedTo: [String],
  
  // Status
  status: {
    type: String,
    enum: ['generated', 'sent', 'opened', 'clicked', 'inactive'],
    default: 'generated'
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

const Recommendation = mongoose.model('Recommendation', recommendationSchema);
export default Recommendation;
