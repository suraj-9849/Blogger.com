import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import DOMPurify from 'dompurify';

interface BlogData {
  id: number;
  title: string;
  content: string;
  thumbnail?: string;
  published: boolean;
  authorId: number;
  author: {
    id: number;
    name?: string;
    username: string;
  };
  publishedAt?: string;
  readTime?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
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

interface BlogProps {
  isAuthenticated?: boolean;
}

function Blog({ isAuthenticated }: BlogProps) {
  const { id } = useParams();
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        if (!id) {
          setError('Blog ID not provided');
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Blog not found');
          } else {
            setError('Failed to fetch blog');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (data.success) {
          setBlog(data.data);
          setLikeCount(data.data.likeCount || 0);
          
          await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/${id}/view`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          
          setCommentsLoading(true);
          try {
            const commentsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/${id}/comments`);
            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              setComments(commentsData.data);
            }
          } finally {
            setCommentsLoading(false);
          }
        } else {
          setError(data.error || 'Failed to load blog');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch blog');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatReadTime = (readTime?: number) => {
    if (!readTime) return '5 min read';
    return `${readTime} min read`;
  };

  const renderBlogContent = (content: string) => {
    // Sanitize the HTML content
    const sanitizedContent = DOMPurify.sanitize(content, {
      ADD_TAGS: ['iframe', 'pre', 'code'],
      ADD_ATTR: ['class', 'style', 'id', 'data-language'],
    });

    return (
      <div 
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please login to like blogs');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsLiked(data.data.liked);
          setLikeCount(prev => data.data.liked ? prev + 1 : prev - 1);
        }
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      alert('Please login to bookmark blogs');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/${id}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsBookmarked(data.data.bookmarked);
        }
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setCommentSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/${id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComments(prev => [data.data, ...prev]);
          setNewComment('');
          
          if (blog) {
            setBlog(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !blog) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">{error || 'Failed to load blog'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Blog Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
          <div className="flex items-center gap-4 text-gray-600 text-sm">
            <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
            <span>·</span>
            <span>{formatReadTime(blog.readTime)}</span>
            <span>·</span>
            <span>{blog.viewCount} views</span>
          </div>
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {blog.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: tag.color || '#e5e7eb',
                    color: tag.color ? '#ffffff' : '#374151'
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Blog Content */}
        <div className="blog-content">
          {blog.thumbnail && (
            <img
              src={blog.thumbnail}
              alt={blog.title}
              className="w-full h-auto rounded-lg shadow-lg mb-8"
            />
          )}
          {renderBlogContent(blog.content)}
        </div>

        {/* Author Info */}
        <footer className="mt-12 pt-8 border-t">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              {blog.author.name?.[0] || blog.author.username[0]}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {blog.author.name || blog.author.username}
              </h3>
              <p className="text-sm text-gray-600">
                Published on {formatDate(blog.publishedAt || blog.createdAt)}
              </p>
            </div>
          </div>
        </footer>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isLiked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            } hover:bg-blue-50 transition-colors`}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span>{likeCount}</span>
          </button>
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isBookmarked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
            } hover:bg-yellow-50 transition-colors`}
          >
            <span>{isBookmarked ? '🔖' : '🏷️'}</span>
            <span>Save</span>
          </button>
        </div>

        {/* Comments Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <button
                type="submit"
                disabled={commentSubmitting || !newComment.trim()}
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {commentSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <p className="text-gray-600 mb-8">
              Please <a href="/signin" className="text-blue-600 hover:underline">sign in</a> to comment
            </p>
          )}
          
          {commentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      {comment.author.name?.[0] || comment.author.username[0]}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        {comment.author.name || comment.author.username}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </article>
    </Layout>
  );
}

export default Blog;
