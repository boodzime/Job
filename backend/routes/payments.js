import express from 'express';
import Stripe from 'stripe';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Pricing Plans
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    cvAnalysisCredits: 5,
    mockInterviewCredits: 0,
    jobMatchingCredits: 10
  },
  starter: {
    name: 'Starter',
    price: 29,
    cvAnalysisCredits: 20,
    mockInterviewCredits: 3,
    jobMatchingCredits: 50
  },
  pro: {
    name: 'Pro',
    price: 79,
    cvAnalysisCredits: 100,
    mockInterviewCredits: 10,
    jobMatchingCredits: 200
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    cvAnalysisCredits: 'unlimited',
    mockInterviewCredits: 'unlimited',
    jobMatchingCredits: 'unlimited'
  }
};

// Get pricing plans
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Create checkout session
router.post('/checkout', auth, async (req, res) => {
  try {
    const { planName, billingCycle } = req.body;
    
    if (!PLANS[planName]) {
      return res.status(400).json({ message: 'Invalid plan' });
    }
    
    if (planName === 'free') {
      return res.status(400).json({ message: 'Free plan cannot be purchased' });
    }
    
    const user = await User.findById(req.user.id);
    const plan = PLANS[planName];
    
    // Create Stripe price (simplified - in production use Stripe products/prices API)
    const amount = billingCycle === 'annual' ? plan.price * 12 * 100 : plan.price * 100;
    
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'pln',
          product_data: {
            name: `${plan.name} Plan (${billingCycle})`,
            description: `CV Analysis: ${plan.cvAnalysisCredits} credits`
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancelled`,
      metadata: {
        userId: user._id.toString(),
        planName,
        billingCycle
      }
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Error creating checkout session', error: error.message });
  }
});

// Get user subscription
router.get('/subscription/current', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id, status: 'active' });
    res.json(subscription || null);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription', error: error.message });
  }
});

// Get user payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'charge.succeeded':
        // Handle successful payment
        const charge = event.data.object;
        const payment = new Payment({
          userId: charge.metadata.userId,
          amount: charge.amount / 100,
          status: 'succeeded',
          stripePaymentIntentId: charge.payment_intent
        });
        await payment.save();
        break;
        
      case 'charge.failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object);
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
