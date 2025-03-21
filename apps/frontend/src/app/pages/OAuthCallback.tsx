import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import CompleteSignupForm from '../components/CompleteSignupForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface OAuthUserData {
  userId: string;
  email: string;
  name: string;
  provider: string;
  profilePicture?: string;
}

const OAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<OAuthUserData | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth() as any;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    const email = params.get('email');
    const name = params.get('name');
    const provider = params.get('provider');
    const profilePicture = params.get('picture');
    
    console.log('OAuth callback params:', { userId, email, name, provider, profilePicture });
    
    if (!userId || !email || !name || !provider) {
      setError('Invalid callback data');
      setLoading(false);
      return;
    }
    
    setUserData({
      userId,
      email,
      name,
      provider,
      profilePicture: profilePicture || undefined
    });
    
    setLoading(false);
  }, [location]);

  const handleFormSubmit = async (formData: any) => {
      console.log('Sending OAuth completion request:', formData);
      
      const response = await axios.post(`${API_URL}/auth/google/complete-oauth-signup`, formData);
      
      console.log('OAuth completion response:', response.data);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        // Save tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Set default Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
        
        // Set user
        setUser(user);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        throw new Error(response.data.error || 'Failed to complete signup');
      }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
        <p className="text-center mt-4">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-4">
          {error}
        </div>
        <div className="text-center">
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return userData ? (
    <CompleteSignupForm
      initialData={{
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        provider: userData.provider
      }}
      onSubmit={handleFormSubmit}
    />
  ) : null;
};

export default OAuthCallback; 