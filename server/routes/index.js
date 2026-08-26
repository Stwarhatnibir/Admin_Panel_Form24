const express = require('express');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const userRoutes = require('./userRoutes');
const applicationRoutes = require('./applicationRoutes');
const schemeRoutes = require('./schemeRoutes');
const conversationRoutes = require('./conversationRoutes');
const documentRoutes = require('./documentRoutes');
const otpRoutes = require('./otpRoutes');
const paymentRoutes = require('./paymentRoutes');
const refundRoutes = require('./refundRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/applications', applicationRoutes);
router.use('/schemes', schemeRoutes);
router.use('/conversations', conversationRoutes);
router.use('/documents', documentRoutes);
router.use('/otp-requests', otpRoutes);
router.use('/payments', paymentRoutes);
router.use('/refunds', refundRoutes);
router.use('/notifications', notificationRoutes);

// Additional route modules (admins, audit-logs) are added here as each
// build phase is implemented - see PHASES.md.

module.exports = router;
