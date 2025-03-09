import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const response = await axios.get(`${API_URL}/users/${user.id}`);
        if (response.data.success) {
          setUserProfile(response.data.data.user);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch user profile');
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Validation schema for profile
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters'),
    bio: Yup.string(),
    skills: Yup.array()
      .of(Yup.string()),
    profilePicture: Yup.string()
      .url('Must be a valid URL')
  });

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      name: userProfile?.name || '',
      bio: userProfile?.bio || '',
      skills: userProfile?.skills || [],
      profilePicture: userProfile?.profilePicture || '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      if (!user) return;
      
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      try {
        const response = await axios.put(`${API_URL}/users/${user.id}`, values);
        
        if (response.data.success) {
          setUserProfile(response.data.data.user);
          setSuccessMessage('Profile updated successfully');
          setIsEditing(false);
        } else {
          setError(response.data.error || 'Failed to update profile');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to update profile');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  if (!user || !userProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 mb-6 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isEditing ? (
          <form onSubmit={formik.handleSubmit}>
            {/* Name field */}
            <div className="mb-4">
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`w-full px-3 py-2 border ${
                  formik.touched.name && formik.errors.name
                    ? 'border-red-500'
                    : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
              />
              {formik.touched.name && formik.errors.name && (
                <div className="mt-1 text-sm text-red-500">{formik.errors.name as string}</div>
              )}
            </div>
            
            {/* Profile picture field */}
            <div className="mb-4">
              <label 
                htmlFor="profilePicture" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Profile Picture URL (Optional)
              </label>
              <input
                id="profilePicture"
                name="profilePicture"
                type="text"
                placeholder="https://example.com/your-image.jpg"
                className={`w-full px-3 py-2 border ${
                  formik.touched.profilePicture && formik.errors.profilePicture
                    ? 'border-red-500'
                    : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.profilePicture}
              />
              {formik.touched.profilePicture && formik.errors.profilePicture && (
                <div className="mt-1 text-sm text-red-500">{formik.errors.profilePicture as string}</div>
              )}
              {formik.values.profilePicture && (
                <div className="mt-2">
                  <img 
                    src={formik.values.profilePicture} 
                    alt="Profile preview" 
                    className="w-20 h-20 object-cover rounded-full border border-gray-300"
                  />
                </div>
              )}
            </div>
            
            {/* Bio field */}
            <div className="mb-4">
              <label 
                htmlFor="bio" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                placeholder="Tell us a little about yourself..."
                className={`w-full px-3 py-2 border ${
                  formik.touched.bio && formik.errors.bio
                    ? 'border-red-500'
                    : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.bio}
              ></textarea>
              {formik.touched.bio && formik.errors.bio && (
                <div className="mt-1 text-sm text-red-500">{formik.errors.bio as string}</div>
              )}
            </div>
            
            {/* Skills field (for juniors) */}
            {user.role === 'junior' && (
              <div className="mb-6">
                <label 
                  htmlFor="skills" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Skills (Optional, comma separated)
                </label>
                <input
                  id="skills"
                  name="skills"
                  type="text"
                  placeholder="e.g. React, Node.js, TypeScript"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const skillsArray = e.target.value ? e.target.value.split(',').map(s => s.trim()) : [];
                    formik.setFieldValue('skills', skillsArray);
                  }}
                  onBlur={formik.handleBlur}
                  value={formik.values.skills.join(', ')}
                />
              </div>
            )}
            
            {/* Submit buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Profile display */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                  {userProfile.profilePicture ? (
                    <img 
                      src={userProfile.profilePicture} 
                      alt={userProfile.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-2xl">
                      {userProfile.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{userProfile.name}</h2>
                  <p className="text-gray-500">
                    {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Member since {new Date(userProfile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Edit Profile
              </button>
            </div>
            
            {/* Bio section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Bio</h3>
              <p className="text-gray-700">
                {userProfile.bio || <span className="text-gray-400 italic">No bio provided</span>}
              </p>
            </div>
            
            {/* Skills section (for juniors) */}
            {user.role === 'junior' && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Skills</h3>
                {userProfile.skills && userProfile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userProfile.skills.map((skill: string, index: number) => (
                      <span 
                        key={index}
                        className="bg-blue-50 text-blue-700 px-2 py-1 text-sm rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No skills listed</p>
                )}
              </div>
            )}
            
            {/* Email section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Contact</h3>
              <p className="text-gray-700">{userProfile.email}</p>
            </div>
            
            {/* Account settings */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
              <div className="flex space-x-2">
                <button
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Change Password
                </button>
                <span className="text-gray-500">•</span>
                <button
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 