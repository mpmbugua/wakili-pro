import { Router } from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  changePassword,
  googleOAuth,
  facebookOAuth
} from '../controllers/authController';
import { simpleRegister } from '../controllers/simpleAuthController';
import { authenticateToken } from '../middleware/auth';

import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (PUBLIC or LAWYER)
 * @access  Public
 * @body    { email, password, firstName, lastName, phoneNumber?, role }
 */
router.post('/register', simpleRegister);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 * @body    { refreshToken }
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.post('/change-password', authenticateToken, changePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset link
 * @access  Public
 * @body    { email }
 */
import { forgotPassword, resetPassword } from '../controllers/authController';
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 * @body    { token, newPassword }
 */
router.post('/reset-password', resetPassword);

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth login
 * @access  Public
 * @body    { idToken }
 */
router.post('/google', googleOAuth);

/**
 * @route   POST /api/auth/facebook
 * @desc    Facebook OAuth login
 * @access  Public
 * @body    { accessToken }
 */
router.post('/facebook', facebookOAuth);

export default router;