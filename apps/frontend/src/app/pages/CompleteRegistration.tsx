import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CompleteSignupForm from '../components/CompleteSignupForm';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CompleteRegistration = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth() as any;

  // Extract user data from location state
  const userData = location.state?.userData;

  useEffect(() => {
    if (!userData) {
      setError('No user data found. Please register again.');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userData]);

  const handleFormSubmit = async (formData: any) => {
      console.log('Sending registration completion request:', formData);
      
      const response = await axios.post(`${API_URL}/auth/register/complete`, formData);
      
      console.log('Registration completion response:', response.data);
      
      if (response.data.success) {
        const { user } = response.data.data;
        
        // Save tokens
        localStorage.setItem('accessToken', user.accessToken);
        localStorage.setItem('refreshToken', user.refreshToken);
        
        // Set default Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${user.accessToken}`;
        
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
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
            onClick={() => navigate('/register')}
            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
          >
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <CompleteSignupForm
      initialData={{
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        provider: 'local'
      }}
      onSubmit={handleFormSubmit}
    />
  );
};

export default CompleteRegistration; 