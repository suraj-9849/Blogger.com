import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { BlogCard } from '../components/BlogCard';
import { API_ENDPOINTS, api } from '../config/api';

interface ProfileProps {
  isAuthenticated?: boolean;
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  } | null;
}

interface UserProfile {
  id: number;
  name?: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  website?: string;
  location?: string;
  verified: boolean;
  _count?: {
    blogs: number;
    followers: number;
    following: number;
  };
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
  published: boolean;
  author: {
    id: number;
    name?: string;
    username: string;
  };
  authorId: number;
  publishedAt?: string;
  readTime?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
  tags?: {
    id: number;
    tag: {
      id: number;
      name: string;
      slug: string;
      color?: string;
    };
  }[];
}

export function Profile(_: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    website: '',
    location: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to view your profile');
        setLoading(false);
        return;
      }

      const response = await api.get(API_ENDPOINTS.USER.ME, token);

      if (response.success) {
        setProfile(response.data);
        setEditForm({
          name: response.data.name || '',
          bio: response.data.bio || '',
          website: response.data.website || '',
          location: response.data.location || ''
        });
        fetchUserBlogs(response.data.username);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBlogs = async (username: string) => {
    setBlogsLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.USER.BLOGS(username));
      if (response.success) {
        setBlogs(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching user blogs:', err);
    } finally {
      setBlogsLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.put(API_ENDPOINTS.USER.PROFILE, editForm, token);

      if (response.success) {
        setProfile(response.data);
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="flex items-start space-x-6 mb-8">
              <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-64"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">{error || 'Profile not found'}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start space-x-6 mb-8">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt={profile.name || profile.username} 
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-4xl text-gray-500">
                {profile.name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Name"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Bio"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="Website"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Location"
                  className="w-full p-2 border rounded"
                />
                <div className="flex space-x-4">
                  <button
                    onClick={updateProfile}
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold">
                    {profile.name || profile.username}
                    {profile.verified && (
                      <span className="ml-2 text-blue-500">✓</span>
                    )}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                  >
                    Edit Profile
                  </button>
                </div>
                <div className="text-gray-600 mb-4">@{profile.username}</div>
                {profile.bio && (
                  <div className="text-gray-800 mb-4">{profile.bio}</div>
                )}
                <div className="flex items-center text-gray-600 space-x-6">
                  {profile.location && (
                    <span>📍 {profile.location}</span>
                  )}
                  {profile.website && (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-black hover:underline"
                    >
                      🔗 Website
                    </a>
                  )}
                </div>
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
                  <span>{profile._count?.blogs || 0} Stories</span>
                  <span>{profile._count?.followers || 0} Followers</span>
                  <span>{profile._count?.following || 0} Following</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-t pt-8">
          <h2 className="text-xl font-bold mb-6">Stories</h2>
          {blogsLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="animate-pulse">
                  <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : blogs.length > 0 ? (
            <div className="space-y-6">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-8">
              No stories published yet.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 