import  { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { BlogCard } from '../components/BlogCard';
import { Search } from '../components/Search';

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

interface BlogsProps {
  isAuthenticated?: boolean;
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  } | null;
}

function Blogs({ isAuthenticated, user }: BlogsProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog?published=true&limit=20`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }

        const data = await response.json();
        
        if (data.success) {
          setBlogs(data.data);
        } else {
          setError(data.error || 'Failed to load blogs');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
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
      <Layout>
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
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Latest Stories</h1>
          <p className="text-gray-600 mb-6">Discover the latest articles from our community</p>
          
          {/* Search Section */}
          <div className="max-w-2xl">
            <Search />
          </div>
        </div>
          
        <div className="space-y-0">
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stories yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first blog post.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Blogs;
