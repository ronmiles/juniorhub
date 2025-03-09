import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-rose-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold">
            JuniorHub
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-rose-200">
              Home
            </Link>
            <Link to="/projects" className="hover:text-rose-200">
              Projects
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-rose-200">
                  Dashboard
                </Link>
                {user.role === 'company' && (
                  <Link to="/create-project" className="hover:text-rose-200">
                    Create Project
                  </Link>
                )}
                <Link to="/profile" className="hover:text-rose-200">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:text-rose-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-rose-200">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-rose-500 px-4 py-2 rounded-md hover:bg-rose-50"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <nav className="mt-4 md:hidden flex flex-col space-y-4">
            <Link
              to="/"
              className="hover:text-rose-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/projects"
              className="hover:text-rose-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Projects
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="hover:text-rose-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {user.role === 'company' && (
                  <Link
                    to="/create-project"
                    className="hover:text-rose-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Project
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="hover:text-rose-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="hover:text-rose-200 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:text-rose-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-rose-500 px-4 py-2 rounded-md hover:bg-rose-50 inline-block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 