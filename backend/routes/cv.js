import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import CV from '../models/CV.js';
import User from '../models/User.js';

const router = express.Router();

// Setup multer for file uploads
const upload = multer({
  dest: 'uploads/cv/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Upload CV
router.post('/upload', auth, authorize('job_seeker'), upload.single('cv'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check credits
    if (user.subscription.credits <= 0) {
      return res.status(403).json({ 
        message: 'No credits available. Please upgrade your plan.',
        creditsUsed: user.subscription.creditsUsed,
        totalCredits: user.subscription.credits
      });
    }

    // Create CV record
    const cv = new CV({
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    await cv.save();

    // Deduct credit
    user.subscription.credits -= 1;
    user.subscription.creditsUsed += 1;
    user.cvAnalysisCount += 1;
    await user.save();

    res.status(201).json({
      message: 'CV uploaded successfully',
      cv: cv,
      creditsRemaining: user.subscription.credits
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading CV', error: error.message });
  }
});

// Get user's CVs
router.get('/my-cvs', auth, authorize('job_seeker'), async (req, res) => {
  try {
    const cvs = await CV.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(cvs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching CVs', error: error.message });
  }
});

// Get CV details
router.get('/:id', auth, async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id);
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }
    
    // Check authorization
    if (cv.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(cv);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching CV', error: error.message });
  }
});

// Analyze CV with AI
router.post('/:id/analyze', auth, authorize('job_seeker'), async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id);
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }
    
    // Check authorization
    if (cv.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // TODO: Integrate with Google Gemini for AI analysis
    // For now, return mock analysis
    cv.aiAnalysis = {
      atsScore: 78,
      strengths: ['Clear structure', 'Good technical skills listed'],
      weaknesses: ['Missing quantifiable achievements', 'No projects section'],
      recommendations: ['Add specific metrics to achievements', 'Include portfolio link'],
      suggestedSkills: ['AI/ML', 'Cloud Computing', 'Docker'],
      personalizedAdvice: 'Your CV is solid but needs more emphasis on impact. Use metrics and numbers.',
      analyzedAt: new Date()
    };
    
    await cv.save();
    
    res.json({
      message: 'CV analyzed successfully',
      analysis: cv.aiAnalysis
    });
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing CV', error: error.message });
  }
});

// Delete CV
router.delete('/:id', auth, authorize('job_seeker'), async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id);
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }
    
    if (cv.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await CV.deleteOne({ _id: req.params.id });
    res.json({ message: 'CV deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting CV', error: error.message });
  }
});

export default router;
