import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, api } from '../config/api';

interface AuthProps {
  type: 'signin' | 'signup';
  onSuccess?: (user: any) => void;
}

export function Auth({ type, onSuccess }: AuthProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = type === 'signin' ? API_ENDPOINTS.USER.SIGNIN : API_ENDPOINTS.USER.SIGNUP;
      const response = await api.post(endpoint, formData);

      if (response.success) {
        localStorage.setItem('token', response.data.token);
        
        // Fetch user details
        const userResponse = await api.get(API_ENDPOINTS.USER.ME, response.data.token);
        
        if (userResponse.success) {
          if (onSuccess) {
            onSuccess(userResponse.data);
          }
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {type === 'signin' ? 'Sign In' : 'Create Account'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {type === 'signup' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-black"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-black"
                required
              />
            </div>
          </>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 border rounded focus:outline-none focus:border-black"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-2 border rounded focus:outline-none focus:border-black"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-black text-white p-2 rounded hover:bg-gray-800 focus:outline-none ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Please wait...' : type === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
} 