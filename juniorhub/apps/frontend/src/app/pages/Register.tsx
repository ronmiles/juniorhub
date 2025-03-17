import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Register = () => {
  const { register, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    role: Yup.string()
      .required('Please select a role')
      .oneOf(['junior', 'company'], 'Invalid role')
  });

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        await register(
          values.name,
          values.email,
          values.password,
          values.role as 'junior' | 'company'
        );
        navigate('/dashboard');
      } catch (err) {
        // Error is handled by useAuth hook
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Create your account</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        {/* Name field */}
        <div className="mb-4">
          <label 
            htmlFor="name" 
            className="block text-gray-700 text-sm font-medium mb-2"
          >
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            className={`w-full px-3 py-2 border ${
              formik.touched.name && formik.errors.name 
                ? 'border-red-500' 
                : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.name}
          />
          {formik.touched.name && formik.errors.name && (
            <div className="mt-1 text-sm text-red-500">{formik.errors.name}</div>
          )}
        </div>
        
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
        <div className="mb-4">
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
        
        {/* Role selection */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            I am a:
          </label>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                id="role-junior"
                name="role"
                type="radio"
                value="junior"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                checked={formik.values.role === 'junior'}
                className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300"
              />
              <label 
                htmlFor="role-junior"
                className="ml-2 block text-sm text-gray-700"
              >
                Junior Developer
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="role-company"
                name="role"
                type="radio"
                value="company"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                checked={formik.values.role === 'company'}
                className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300"
              />
              <label 
                htmlFor="role-company"
                className="ml-2 block text-sm text-gray-700"
              >
                Company
              </label>
            </div>
          </div>
          {formik.touched.role && formik.errors.role && (
            <div className="mt-1 text-sm text-red-500">{formik.errors.role}</div>
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
              Creating account...
            </span>
          ) : (
            'Create account'
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
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <a
              href="#"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            </a>
          </div>
          
          <div>
            <a
              href="#"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.998 12c0-6.628-5.372-12-11.999-12C5.372 0 0 5.372 0 12c0 5.988 4.388 10.952 10.124 11.852v-8.384H7.078v-3.469h3.046V9.356c0-3.008 1.792-4.669 4.532-4.669 1.313 0 2.686.234 2.686.234v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.469h-2.796v8.384c5.736-.9 10.124-5.864 10.124-11.853z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      {/* Login link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="font-medium text-rose-500 hover:text-rose-600"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register; 