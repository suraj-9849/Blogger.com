import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlogCard } from '../components/BlogCard';

interface Author {
  id: number;
  name?: string;
  username: string;
}

interface TagData {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

interface BlogTag {
  id: number;
  tag: TagData;
}

interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  thumbnail?: string;
  slug: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  readTime?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  authorId: number;
  author: Author;
  tags: BlogTag[];
}

const Tag = () => {
  const { tagName } = useParams<{ tagName: string }>();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchBlogsByTag = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching blogs for tag:', tagName);
        
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/tag/${encodeURIComponent(tagName || '')}?page=${page}&limit=10`
        );
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Tag "${tagName}" not found. Please check the tag name and try again.`);
          }
          throw new Error('Failed to fetch blogs');
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.success) {
          setBlogs(data.data);
          setTotalPages(data.pagination.pages);
        } else {
          throw new Error(data.error || 'Failed to fetch blogs');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tagName) {
      fetchBlogsByTag();
    }
  }, [tagName, page]);

  if (!tagName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Tag name is required</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-center max-w-md">{error}</p>
        <div className="flex gap-4">
          <Link to="/blogs" className="text-blue-500 hover:underline">
            Browse all blogs
          </Link>
          <Link to="/" className="text-blue-500 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 capitalize">
        Posts tagged with "{decodeURIComponent(tagName)}"
      </h1>
      
      {blogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No blogs found with this tag.</p>
          <div className="flex gap-4 justify-center mt-4">
            <Link to="/blogs" className="text-blue-500 hover:underline">
              Browse all blogs
            </Link>
            <Link to="/" className="text-blue-500 hover:underline">
              Go back home
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded ${
                  page === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded ${
                  page === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Tag; 