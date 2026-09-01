import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, bio, phone, location, company, website, profilePicture } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, bio, phone, location, company, website, profilePicture },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Get recruiter profile (for job seekers to see)
router.get('/recruiter/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -subscription');
    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recruiter', error: error.message });
  }
});

// Get all recruiters (for job seekers)
router.get('/recruiters', async (req, res) => {
  try {
    const recruiters = await User.find({ role: 'recruiter' })
      .select('-password -subscription')
      .limit(50);
    res.json(recruiters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recruiters', error: error.message });
  }
});

// Delete account
router.delete('/profile', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

export default router;
