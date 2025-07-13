import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const Navbar = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-2xl font-bold text-black hover:text-gray-700 transition-colors"
            >
              BlogSpace
            </Link>
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/blogs" 
              className="text-gray-700 hover:text-black transition-colors"
            >
              Stories
            </Link>
            <Link 
              to="/trending" 
              className="text-gray-700 hover:text-black transition-colors"
            >
              Trending
            </Link>
            {isAuthenticated && (
              <Link 
                to="/bookmarks" 
                className="text-gray-700 hover:text-black transition-colors flex items-center space-x-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>Bookmarks</span>
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/publish"
                  className="flex items-center space-x-1 text-gray-700 hover:text-black transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Write</span>
                </Link>
                
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-black transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {user?.name?.[0]?.toUpperCase() || user?.username[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                      <div className="px-4 py-2 text-sm text-gray-700">
                        {user?.name || user?.username}
                      </div>
                      <hr className="my-1" />
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/my-stories"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Stories
                      </Link>
                      <Link
                        to="/bookmarks"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Bookmarks
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-gray-700 hover:text-black transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}; 