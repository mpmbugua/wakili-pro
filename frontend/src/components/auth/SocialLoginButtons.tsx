import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SocialLoginButtonsProps {
  onGoogleLogin?: (credentialResponse: CredentialResponse) => void;
  onFacebookLogin?: () => void;
  onAppleLogin?: () => void;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGoogleLogin,
  onFacebookLogin,
  onAppleLogin
}) => {
  const navigate = useNavigate();
  
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (onGoogleLogin) {
        onGoogleLogin(credentialResponse);
        return;
      }
      
      // Send credential to backend
      const response = await axios.post('https://wakili-pro.onrender.com/api/auth/google', {
        idToken: credentialResponse.credential,
      });
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Google login failed:', error);
      const errorMessage = error.response?.data?.message || 'Google login failed. Please try again.';
      alert(errorMessage);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    alert('Google login failed. Please try again.');
  };

  const handleFacebookResponse = async (response: any) => {
    try {
      if (onFacebookLogin) {
        onFacebookLogin();
        return;
      }

      if (response.accessToken) {
        // Send access token to backend
        const result = await axios.post('https://wakili-pro.onrender.com/api/auth/facebook', {
          accessToken: response.accessToken,
        });
        
        if (result.data.success) {
          const { user, accessToken, refreshToken } = result.data.data;
          
          // Store tokens in localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Navigate to dashboard
          navigate('/dashboard');
        }
      } else {
        console.error('Facebook login cancelled or failed');
      }
    } catch (error: any) {
      console.error('Facebook login failed:', error);
      const errorMessage = error.response?.data?.message || 'Facebook login failed. Please try again.';
      alert(errorMessage);
    }
  };

  const handleAppleLogin = () => {
    if (onAppleLogin) {
      onAppleLogin();
    } else {
      alert('Apple login integration coming soon! This will allow you to sign in with your Apple ID.');
    }
  };

  return (
    <>
      {/* Social Login Buttons */}
      <div className="space-y-3">
        {/* Google Login - Full Width with @react-oauth/google */}
        <div className="w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        {/* Facebook & Apple Login - Side by Side */}
        <div className="grid grid-cols-2 gap-3">
          <FacebookLogin
            appId="2239381283209458"
            fields="id,email,first_name,last_name,name,picture"
            scope="public_profile,email"
            onSuccess={handleFacebookResponse}
            onFail={(error: any) => {
              console.error('Facebook login failed:', error);
            }}
            onProfileSuccess={(response: any) => {
              console.log('Facebook profile:', response);
            }}
            render={({ onClick }) => (
              <button
                type="button"
                onClick={onClick}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Facebook</span>
              </button>
            )}
          />

          <button
            type="button"
            onClick={handleAppleLogin}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Apple</span>
          </button>
        </div>
      </div>

      {/* Elegant Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
        </div>
      </div>
    </>
  );
};
