import express from 'express';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import CV from '../models/CV.js';
import JobMatch from '../models/JobMatch.js';
import Recommendation from '../models/Recommendation.js';
import User from '../models/User.js';
import { matchCVWithJobs, generateJobRecommendations, generatePersonalizedJobEmail } from '../services/jobMatchingService.js';
import pdfParse from 'pdf-parse';
import fs from 'fs';

const router = express.Router();

// Mock job listings (in production, fetch from database)
const MOCK_JOBS = [
  {
    id: 'job_1',
    title: 'Senior Full Stack Developer',
    company: 'Tech Corp',
    location: 'Warszawa',
    salary: '12000-16000 PLN',
    type: 'full-time',
    description: 'Szukamy doświadczonego full stack developera z min. 5 latami doświadczenia. Wymagana wiedza: Node.js, React, MongoDB, AWS.',
    requirements: ['Node.js', 'React', 'MongoDB', 'AWS', 'Docker'],
    category: 'IT'
  },
  {
    id: 'job_2',
    title: 'Frontend Developer',
    company: 'Digital Agency',
    location: 'Remote',
    salary: '8000-12000 PLN',
    type: 'full-time',
    description: 'Poszukujemy frontend developera specjalizującego się w React i Vue.js',
    requirements: ['React', 'Vue.js', 'JavaScript', 'CSS', 'HTML'],
    category: 'IT'
  },
  {
    id: 'job_3',
    title: 'Data Science Engineer',
    company: 'AI Startup',
    location: 'Kraków',
    salary: '14000-18000 PLN',
    type: 'full-time',
    description: 'Szukamy Data Scientist z doświadczeniem w ML i deep learning',
    requirements: ['Python', 'TensorFlow', 'Machine Learning', 'SQL', 'Statistics'],
    category: 'IT'
  }
];

// Get personalized job recommendations
router.get('/for-me', auth, authorize('job_seeker'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const cv = await CV.findOne({ userId: req.user.id, isActive: true });
    
    if (!cv) {
      return res.status(400).json({ message: 'Please upload a CV first' });
    }
    
    // Check if analysis already exists and is recent (less than 24 hours)
    const existingRec = await Recommendation.findOne({ 
      userId: req.user.id,
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });
    
    if (existingRec) {
      return res.json({
        message: 'Using cached recommendations from 24 hours ago',
        recommendations: existingRec,
        isCached: true
      });
    }
    
    // Generate new recommendations
    const userPreferences = {
      preferredLocations: [user.location || 'Remote'],
      preferredJobTypes: ['full-time'],
      careerLevel: 'mid' // Could be extracted from CV
    };
    
    // Generate recommendations using AI
    const recommendations = await generateJobRecommendations(
      cv.extractedData,
      userPreferences,
      MOCK_JOBS
    );
    
    // Generate personalized email
    const email = await generatePersonalizedJobEmail(
      user.firstName,
      recommendations.topRecommendations || [],
      recommendations.topRecommendations || []
    );
    
    // Save recommendation
    const rec = new Recommendation({
      userId: req.user.id,
      cvId: cv._id,
      emailSubject: email.subject,
      emailContent: {
        greeting: email.greeting,
        introduction: email.introduction,
        jobRecommendations: email.jobRecommendations,
        applicationAdvice: email.applicationAdvice,
        closingAdvice: email.closingAdvice,
        signature: email.signature
      },
      recommendedJobs: recommendations.topRecommendations.map((job, index) => ({
        jobId: job.jobId || `job_${index}`,
        title: job.title,
        company: job.company,
        matchPercentage: job.matchScore,
        reason: job.whyThisJob,
        url: `/jobs/${job.jobId}`
      })),
      careerGuidance: recommendations.careerGuidance,
      nextSteps: recommendations.nextSteps,
      skillsToFocus: recommendations.suggestedSkillsToAdd
    });
    
    await rec.save();
    
    res.json({
      message: 'Personalized recommendations generated',
      recommendations: rec,
      isCached: false
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Error generating recommendations', error: error.message });
  }
});

// Get job matches for specific CV
router.get('/cv/:cvId', auth, authorize('job_seeker'), async (req, res) => {
  try {
    const cv = await CV.findById(req.params.cvId);
    
    if (!cv || cv.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'CV not found' });
    }
    
    // Get or create matches
    let matches = await JobMatch.find({ cvId: cv._id }).limit(10);
    
    if (matches.length === 0) {
      // Generate new matches
      const matchResults = await matchCVWithJobs(cv.extractedData, MOCK_JOBS);
      
      // Save matches
      matches = await Promise.all(
        matchResults.matches.map(match => {
          const jobMatch = new JobMatch({
            userId: req.user.id,
            cvId: cv._id,
            jobId: match.jobId,
            jobTitle: match.jobTitle,
            company: match.company,
            matchPercentage: match.matchPercentage,
            matchReasons: match.matchReasons,
            missingRequirements: match.missingRequirements,
            salaryFitScore: match.salaryFitScore,
            cultureFitScore: match.cultureFitScore
          });
          return jobMatch.save();
        })
      );
    }
    
    res.json({
      message: 'Job matches retrieved',
      count: matches.length,
      matches: matches
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Error fetching matches', error: error.message });
  }
});

// Get recommendation email
router.get('/:id/email', auth, async (req, res) => {
  try {
    const rec = await Recommendation.findById(req.params.id);
    
    if (!rec || rec.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    // Mark as opened
    rec.status = 'opened';
    rec.emailOpenedAt = new Date();
    await rec.save();
    
    res.json({
      emailSubject: rec.emailSubject,
      emailContent: rec.emailContent,
      recommendedJobs: rec.recommendedJobs,
      careerGuidance: rec.careerGuidance,
      nextSteps: rec.nextSteps
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching email', error: error.message });
  }
});

// Mark job as interested/applied
router.put('/job/:jobId/status', auth, authorize('job_seeker'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['interested', 'applied', 'interviewed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const match = await JobMatch.findOneAndUpdate(
      { userId: req.user.id, jobId: req.params.jobId },
      { status },
      { new: true }
    );
    
    if (!match) {
      return res.status(404).json({ message: 'Job match not found' });
    }
    
    res.json({
      message: 'Status updated',
      match
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Get recommendations history
router.get('/history/all', auth, authorize('job_seeker'), async (req, res) => {
  try {
    const recommendations = await Recommendation.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

export default router;
