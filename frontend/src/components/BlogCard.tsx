import { useState } from 'react';
import { Link } from 'react-router-dom';

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
  bookmarked?: boolean;
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

interface BlogCardProps {
  blog: BlogPost;
}

export const BlogCard = ({ blog }: BlogCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(blog.bookmarked || false);
  const [bookmarkCount, setBookmarkCount] = useState(blog.bookmarkCount);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getExcerpt = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  const formatReadTime = (readTime?: number) => {
    if (!readTime) return '5 min read';
    return `${readTime} min read`;
  };

  const handleBookmark = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/signin';
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/bookmark/${blog.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      const data = await response.json();
      setIsBookmarked(data.data.bookmarked);
      setBookmarkCount(prev => data.data.bookmarked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error updating bookmark:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <article className="border-b border-gray-200 py-8 last:border-b-0">
      <div className="flex flex-col lg:flex-row lg:space-x-8">
        <div className="flex-grow">
          {/* Author Info */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-medium">
              {blog.author.name?.[0]?.toUpperCase() || blog.author.username[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {blog.author.name || blog.author.username}
            </span>
            <span className="text-gray-400">·</span>
            <time className="text-sm text-gray-500">
              {formatDate(blog.publishedAt || blog.createdAt)}
            </time>
          </div>

          {/* Blog Content */}
          <Link to={`/blog/${blog.id}`} className="group">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-2">
              {blog.title}
            </h2>
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {blog.tags.map(blogTag => (
                  <Link
                    key={blogTag.tag.id}
                    to={`/tag/${blogTag.tag.slug}`}
                    className="text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    style={blogTag.tag.color ? { backgroundColor: `${blogTag.tag.color}20`, color: blogTag.tag.color } : undefined}
                  >
                    {blogTag.tag.name}
                  </Link>
                ))}
              </div>
            )}
            <p className="text-gray-600 text-base mb-4 line-clamp-3">
              {getExcerpt(blog.content)}
            </p>
          </Link>

          {/* Reading Time and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {formatReadTime(blog.readTime)}
              </span>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{blog.viewCount}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{blog.likeCount}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{blog.commentCount}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                className={`text-gray-400 hover:text-gray-600 transition-colors ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleBookmark}
                disabled={isUpdating}
              >
                <svg 
                  className="w-5 h-5" 
                  fill={isBookmarked ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                  />
                </svg>
                <span className="ml-1">{bookmarkCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="lg:w-32 lg:h-32 mt-4 lg:mt-0">
          <Link to={`/blog/${blog.id}`}>
            {blog.thumbnail ? (
              <img 
                src={blog.thumbnail}
                alt={blog.title}
                className="w-full h-32 lg:h-full object-cover rounded hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-full h-32 lg:h-full bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 transition-colors">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}; 