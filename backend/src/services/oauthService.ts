import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface GoogleTokenPayload {
  sub: string;          // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

interface FacebookUserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  picture: {
    data: {
      url: string;
    };
  };
}

/**
 * Verify Google ID token and return user payload
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }
    
    return {
      sub: payload.sub,
      email: payload.email!,
      email_verified: payload.email_verified || false,
      name: payload.name || '',
      given_name: payload.given_name || '',
      family_name: payload.family_name || '',
      picture: payload.picture || '',
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}

/**
 * Verify Facebook access token and fetch user data
 */
export async function verifyFacebookToken(accessToken: string): Promise<FacebookUserData> {
  try {
    // Verify token with Facebook Graph API
    const debugResponse = await axios.get(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
    );
    
    if (!debugResponse.data.data.is_valid) {
      throw new Error('Invalid Facebook token');
    }
    
    // Fetch user data
    const userResponse = await axios.get<FacebookUserData>(
      `https://graph.facebook.com/me?fields=id,email,first_name,last_name,name,picture&access_token=${accessToken}`
    );
    
    if (!userResponse.data.email) {
      throw new Error('Email permission required for Facebook login');
    }
    
    return userResponse.data;
  } catch (error: any) {
    console.error('Facebook token verification failed:', error);
    throw new Error(error.message || 'Invalid Facebook token');
  }
}

/**
 * Find or create user from Google OAuth
 */
export async function findOrCreateGoogleUser(payload: GoogleTokenPayload) {
  // Try to find user by googleId first
  let user = await prisma.user.findUnique({
    where: { googleId: payload.sub },
    include: { profile: true, lawyerProfile: true },
  });
  
  if (user) {
    return user;
  }
  
  // Try to find by email (for linking existing accounts)
  user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { profile: true, lawyerProfile: true },
  });
  
  if (user) {
    // Link Google account to existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: payload.sub,
        emailVerified: true,
      },
      include: { profile: true, lawyerProfile: true },
    });
    return user;
  }
  
  // Create new user with Google OAuth
  user = await prisma.user.create({
    data: {
      email: payload.email,
      googleId: payload.sub,
      firstName: payload.given_name || payload.name.split(' ')[0] || 'User',
      lastName: payload.family_name || payload.name.split(' ').slice(1).join(' ') || '',
      emailVerified: true,
      role: 'PUBLIC' as any,
      verificationStatus: 'VERIFIED',
    },
    include: { profile: true, lawyerProfile: true },
  });
  
  // Create user profile
  await prisma.userProfile.create({
    data: {
      userId: user.id,
    },
  });
  
  return user;
}

/**
 * Find or create user from Facebook OAuth
 * Note: Using phoneNumber field temporarily to store provider info until schema migration
 */
export async function findOrCreateFacebookUser(fbData: FacebookUserData) {
  const facebookIdMarker = `facebook:${fbData.id}`;
  
  // Try to find user by facebookId first
  let user = await prisma.user.findUnique({
    where: { facebookId: fbData.id },
    include: { profile: true, lawyerProfile: true },
  });
  
  if (user) {
    return user;
  }
  
  // Try to find by email (for linking existing accounts)
  user = await prisma.user.findUnique({
    where: { email: fbData.email },
    include: { profile: true, lawyerProfile: true },
  });
  
  if (user) {
    // Link Facebook account to existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        facebookId: fbData.id,
        emailVerified: true,
      },
      include: { profile: true, lawyerProfile: true },
    });
    return user;
  }
  
  // Create new user with Facebook OAuth
  user = await prisma.user.create({
    data: {
      email: fbData.email,
      facebookId: fbData.id,
      firstName: fbData.first_name || fbData.name.split(' ')[0] || 'User',
      lastName: fbData.last_name || fbData.name.split(' ').slice(1).join(' ') || '',
      emailVerified: true,
      role: 'PUBLIC' as any,
      verificationStatus: 'VERIFIED',
    },
    include: { profile: true, lawyerProfile: true },
  });
  
  // Create user profile
  await prisma.userProfile.create({
    data: {
      userId: user.id,
    },
  });
  
  return user;
}
