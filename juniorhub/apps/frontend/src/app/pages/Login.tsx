import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFormik } from 'formik';
import * as Yup from 'yup';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const Login = () => {
  const { login, googleLogin, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const navigate = useNavigate();

  // Load Google API
  useEffect(() => {
    const loadGoogleScript = () => {
      // Load the Google API script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleLoaded(true);
      document.body.appendChild(script);
    };

    loadGoogleScript();

    return () => {
      // Cleanup if needed
      const scriptTag = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptTag) {
        scriptTag.remove();
      }
    };
  }, []);

  // Initialize Google Sign-In
  useEffect(() => {
    if (googleLoaded && window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: handleGoogleCallback,
      });
      
      // Render the button
      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement) {
        window.google.accounts.id.renderButton(buttonElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 250
        });
      }
    }
  }, [googleLoaded]);

  // Handle Google Sign-In response
  const handleGoogleCallback = async (response: any) => {
    if (response.credential) {
      setIsSubmitting(true);
      try {
        await googleLogin(response.credential);
        navigate('/dashboard');
      } catch (err) {
        // Error is handled by useAuth hook
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Form validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
  });

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        await login(values.email, values.password);
        navigate('/dashboard');
      } catch (err) {
        // Error is handled by useAuth hook
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  return (
    <div className="max-w-md mx-auto mt-10 mb-20 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Log in to JuniorHub</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        {/* Email field */}
        <div className="mb-4">
          <label 
            htmlFor="email" 
            className="block text-gray-700 text-sm font-medium mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className={`w-full px-3 py-2 border ${
              formik.touched.email && formik.errors.email 
                ? 'border-red-500' 
                : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
          />
          {formik.touched.email && formik.errors.email && (
            <div className="mt-1 text-sm text-red-500">{formik.errors.email}</div>
          )}
        </div>
        
        {/* Password field */}
        <div className="mb-6">
          <label 
            htmlFor="password" 
            className="block text-gray-700 text-sm font-medium mb-2"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className={`w-full px-3 py-2 border ${
              formik.touched.password && formik.errors.password 
                ? 'border-red-500' 
                : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
          />
          {formik.touched.password && formik.errors.password && (
            <div className="mt-1 text-sm text-red-500">{formik.errors.password}</div>
          )}
        </div>
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logging in...
            </span>
          ) : (
            'Log in'
          )}
        </button>
      </form>
      
      {/* OAuth login buttons */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="mt-6 grid gap-1">
          <div>
            {googleLoaded && window.google && (
              <div id="google-signin-button" className="w-full flex justify-center" />
            )}
          </div>
        </div>
      </div>
      
      {/* Registration link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="font-medium text-rose-500 hover:text-rose-600"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 