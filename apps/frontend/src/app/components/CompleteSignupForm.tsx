import { useState } from 'react';

interface CompleteSignupFormProps {
  onSubmit: (formData: any) => Promise<void>;
  initialData?: {
    userId?: string;
    email?: string;
    name?: string;
    provider?: string;
  };
  isLoading?: boolean;
}

const CompleteSignupForm = ({ onSubmit, initialData = {}, isLoading = false }: CompleteSignupFormProps) => {
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'junior' | 'company' | ''>('');
  
  // For junior role
  const [experienceLevel, setExperienceLevel] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [portfolio, setPortfolio] = useState('');
  
  // For company role
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');

  const handleSkillAdd = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleSkillRemove = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create request body based on role
      const requestBody: any = {
        userId: initialData.userId,
        provider: initialData.provider,
        role: selectedRole,
        email: initialData.email,
        name: initialData.name
      };
      
      if (selectedRole === 'junior') {
        requestBody.experienceLevel = experienceLevel;
        requestBody.skills = skills;
        requestBody.portfolio = portfolio;
      } else if (selectedRole === 'company') {
        requestBody.companyName = companyName;
        requestBody.industry = industry;
        requestBody.website = website;
      }
      
      // Call the provided onSubmit callback with the form data
      await onSubmit(requestBody);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err.message || 'An error occurred while completing your profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h1>
      
      {initialData.name && (
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Welcome, <span className="font-semibold">{initialData.name}</span>!
          </p>
          <p className="text-sm text-gray-600">
            {initialData.provider && initialData.provider !== 'local' ? 
              `You're signing up with ${initialData.provider}.` : 
              'Please complete your profile to continue.'}
            
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
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
                onChange={() => setSelectedRole('junior')}
                checked={selectedRole === 'junior'}
                className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300"
                required
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
                onChange={() => setSelectedRole('company')}
                checked={selectedRole === 'company'}
                className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300"
                required
              />
              <label 
                htmlFor="role-company"
                className="ml-2 block text-sm text-gray-700"
              >
                Company
              </label>
            </div>
          </div>
        </div>
        
        {/* Junior specific fields */}
        {selectedRole === 'junior' && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              >
                <option value="">Select your experience level</option>
                <option value="beginner">Beginner (0-1 years)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (3-5 years)</option>
                <option value="expert">Expert (5+ years)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Skills
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={handleSkillAdd}
                  className="px-4 py-2 bg-rose-500 text-white rounded-r-md hover:bg-rose-600"
                >
                  Add
                </button>
              </div>
              {skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full text-sm flex items-center"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleSkillRemove(skill)}
                        className="ml-1 text-rose-500 hover:text-rose-700"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Portfolio URL (optional)
              </label>
              <input
                type="url"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        )}
        
        {/* Company specific fields */}
        {selectedRole === 'company' && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              >
                <option value="">Select your industry</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Website URL (optional)
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading || !selectedRole || (selectedRole === 'junior' && !experienceLevel) || (selectedRole === 'company' && !companyName)}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
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
                Processing...
              </span>
            ) : (
              'Complete Signup'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteSignupForm; 