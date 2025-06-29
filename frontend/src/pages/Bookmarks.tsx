import { useEffect, useState } from 'react';
import { BlogCard } from '../components/BlogCard';

interface BlogPost {
  id: number;
  title: string;
  content: string;
  thumbnail?: string;
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
    name: string;
    slug: string;
    color?: string;
  }[];
}

export const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please sign in to view your bookmarks');
          setLoading(false);
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/bookmark`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
          
        if (!response.ok) {
          throw new Error('Failed to fetch bookmarks');
        }

        const data = await response.json();
        setBookmarks(data.data);
      } catch (err) {
        setError('Failed to load bookmarks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error}
          </h2>
          {error.includes('sign in') && (
            <a
              href="/signin"
              className="inline-block bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
            >
              Sign In
            </a>
          )}
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No bookmarks yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start exploring and bookmark the stories you love to read later.
          </p>
          <a
            href="/blogs"
            className="inline-block bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
          >
            Explore Stories
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Bookmarks</h1>
      <div className="divide-y divide-gray-200">
        {bookmarks.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>
    </div>
  );
}; 