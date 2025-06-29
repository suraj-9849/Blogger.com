import  { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { BlogCard } from '../components/BlogCard';

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
}

interface TrendingProps {
  isAuthenticated?: boolean;
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  } | null;
}

function Trending({ isAuthenticated, user }: TrendingProps) {
  const [trendingBlogs, setTrendingBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrendingBlogs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/trending?limit=10`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch trending blogs');
        }

        const data = await response.json();
        
        if (data.success && data.data.blogs) {
          setTrendingBlogs(data.data.blogs);
        } else {
          setError(data.error || 'Failed to load trending blogs');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch trending blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingBlogs();
  }, []);

  if (loading) {
    return (
      <Layout isAuthenticated={isAuthenticated} user={user}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b border-gray-200 pb-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout isAuthenticated={isAuthenticated} user={user}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">{error}</div>
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
    <Layout isAuthenticated={isAuthenticated} user={user}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trending Stories</h1>
          <p className="text-gray-600">The most engaging stories from our community</p>
        </div>

        <div className="space-y-0">
          {trendingBlogs.length > 0 ? (
            trendingBlogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No trending stories yet</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later for trending content.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Trending; 