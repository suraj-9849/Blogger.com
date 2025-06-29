import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';

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
}

interface BlogProps {
  isAuthenticated?: boolean;
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  } | null;
}

function Blog({ isAuthenticated, user }: BlogProps) {
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

  const renderMarkdownContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      
      if (line.trim() === '') {
        index++;
        continue;
      }

      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        const [, alt, src] = imageMatch;
        elements.push(
          <div key={index} className="my-8">
            <img 
              src={src} 
              alt={alt} 
              className="w-full max-w-full h-auto rounded-lg shadow-lg"
              onError={(e) => {
                console.error('Image failed to load:', src);
                e.currentTarget.style.display = 'none';
              }}
            />
            {alt && (
              <p className="text-center text-sm text-gray-500 mt-2 italic">{alt}</p>
            )}
          </div>
        );
        index++;
        continue;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {line.replace('## ', '')}
          </h2>
        );
        index++;
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            {line.replace('### ', '')}
          </h3>
        );
        index++;
        continue;
      }

      if (line.startsWith('```')) {
        const codeLines: string[] = [];
        index++;
        while (index < lines.length && !lines[index].startsWith('```')) {
          codeLines.push(lines[index]);
          index++;
        }
        elements.push(
          <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        index++;
        continue;
      }

      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
            {line.replace('> ', '')}
          </blockquote>
        );
        index++;
        continue;
      }

      elements.push(
        <p key={index} className="text-gray-700 leading-relaxed mb-4">
          {renderInlineMarkdown(line)}
        </p>
      );
      index++;
    }

    return elements;
  };

  const renderInlineMarkdown = (text: string) => {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    
    text = text.replace(/`([^`]+)`/g, '<code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
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
      <Layout isAuthenticated={isAuthenticated} user={user}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !blog) {
    return (
      <Layout isAuthenticated={isAuthenticated} user={user}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-lg">{error || 'Blog not found'}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
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
      <article className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center text-lg font-medium">
              {blog.author.name?.[0]?.toUpperCase() || blog.author.username[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {blog.author.name || blog.author.username}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <time>{formatDate(blog.publishedAt || blog.createdAt)}</time>
                <span>·</span>
                <span>{formatReadTime(blog.readTime)}</span>
                <span>·</span>
                <span>{blog.viewCount} views</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-y border-gray-200">
            <div className="flex items-center space-x-6">
              <button 
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked ? 'text-red-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm">{likeCount}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm">{blog.commentCount}</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleBookmark}
                className={`transition-colors ${
                  isBookmarked ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-6 h-6" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {blog.thumbnail && (
          <div className="mb-8">
            <img 
              src={blog.thumbnail}
              alt={blog.title}
              className="w-full max-w-3xl h-auto rounded-lg shadow-lg mx-auto"
            />
          </div>
        )}

        <div className="prose prose-lg prose-gray max-w-none mb-12">
          {renderMarkdownContent(blog.content)}
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center text-xl font-medium">
              {blog.author.name?.[0]?.toUpperCase() || blog.author.username[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {blog.author.name || blog.author.username}
              </h3>
              <p className="text-gray-600 mb-3">
                Writer and developer sharing insights about technology and development.
              </p>
              <button className="text-black hover:underline font-medium">
                Follow
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({blog.commentCount})
          </h3>

          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {user?.name?.[0]?.toUpperCase() || user?.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={commentSubmitting || !newComment.trim()}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commentSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">
                <a href="/signin" className="text-black hover:underline">Sign in</a> to leave a comment
              </p>
            </div>
          )}

          <div className="space-y-6">
            {commentsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {comment.user.name?.[0]?.toUpperCase() || comment.user.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {comment.user.name || comment.user.username}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {comment.content}
                    </p>
                          
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-6 space-y-4">
                        {comment.replies.map((reply: any) => (
                          <div key={reply.id} className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {reply.user.name?.[0]?.toUpperCase() || reply.user.username[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">
                                  {reply.user.name || reply.user.username}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </article>
    </Layout>
  );
}

export default Blog;
