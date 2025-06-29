import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignUpInput, signInInput } from '@suraj-9849/common';

interface AuthProps {
  type: 'signup' | 'signin';
}

export const Auth = ({ type }: AuthProps) => {
  const navigate = useNavigate();
  const [postInputs, setPostInputs] = useState<SignUpInput | signInInput>({
    email: "",
    password: "",
    ...(type === 'signup' ? { name: "", username: "" } : {})
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendRequest = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postInputs),
      });

      const json = await response.json();
      
      if (response.ok && json.success) {
        localStorage.setItem("token", json.data.token);
        // Trigger a page reload to update authentication state
        window.location.href = "/blogs";
      } else {
        setError(json.error || `${type} failed`);
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="text-3xl font-bold text-black">
            Blogger.com
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {type === 'signup' ? 'Join Blogger.com' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {type === 'signup' ? (
              <>
                Already have an account?{' '}
                <Link to="/signin" className="font-medium text-black hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-black hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {type === "signup" && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name (Optional)
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                  onChange={(e) => {
                    setPostInputs({
                      ...postInputs,
                      name: e.target.value
                    });
                  }}
                />
              </div>
            )}
            
            {type === "signup" && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                  onChange={(e) => {
                    setPostInputs({
                      ...postInputs,
                      username: e.target.value
                    });
                  }}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                onChange={(e) => {
                  setPostInputs({
                    ...postInputs,
                    email: e.target.value
                  });
                }}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={type === 'signup' ? 'new-password' : 'current-password'}
                required
                placeholder="Enter your password"
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                onChange={(e) => {
                  setPostInputs({
                    ...postInputs,
                    password: e.target.value
                  });
                }}
              />
              {type === 'signup' && (
                <p className="mt-2 text-sm text-gray-500">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={sendRequest}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {type === 'signup' ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                type === 'signup' ? 'Create Account' : 'Sign In'
              )}
            </button>
          </div>

          {type === 'signup' && (
            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 