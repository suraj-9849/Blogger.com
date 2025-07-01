import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';

interface MyStoriesProps {
  isAuthenticated?: boolean;
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  } | null;
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

function MyStories({ isAuthenticated }: MyStoriesProps) {
  const navigate = useNavigate();
  const [stories, setStories] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    fetchMyStories();
  }, [isAuthenticated, navigate]);

  const fetchMyStories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/my/blogs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStories(data.data);
        } else {
          setError(data.error || 'Failed to fetch stories');
        }
      } else {
        setError('Failed to fetch stories');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const deleteStory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(id);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setStories(stories.filter(story => story.id !== id));
      } else {
        setError('Failed to delete story');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete story');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getFilteredStories = () => {
    switch (filter) {
      case 'published':
        return stories.filter(story => story.published);
      case 'drafts':
        return stories.filter(story => !story.published);
      default:
        return stories;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExcerpt = (content: string, maxLength: number = 200) => {
    const text = content.replace(/[#*`>\[\]()]/g, '').replace(/\n/g, ' ');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
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

  const filteredStories = getFilteredStories();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Stories</h1>
            <p className="text-gray-600">Manage and organize your written content</p>
          </div>
          <Link
            to="/publish"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Write New Story
          </Link>
        </div>

        {/* Stats and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stories.length}</div>
              <div className="text-sm text-gray-500">Total Stories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stories.filter(s => s.published).length}</div>
              <div className="text-sm text-gray-500">Published</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stories.filter(s => !s.published).length}</div>
              <div className="text-sm text-gray-500">Drafts</div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {(['all', 'published', 'drafts'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === filterOption
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filterOption === 'all' ? 'All Stories' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stories List */}
        {filteredStories.length > 0 ? (
          <div className="space-y-6">
            {filteredStories.map((story) => (
              <div key={story.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    {/* Story Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        story.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {story.published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {story.published && story.publishedAt 
                          ? `Published ${formatDate(story.publishedAt)}`
                          : `Created ${formatDate(story.createdAt)}`
                        }
                      </span>
                    </div>

                    {/* Story Title and Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {story.title}
                    </h3>
                    
                    {/* Tags */}
                    {story.tags && story.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {story.tags.map(blogTag => (
                          <span
                            key={blogTag.tag.id}
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                            style={blogTag.tag.color ? { backgroundColor: `${blogTag.tag.color}20`, color: blogTag.tag.color } : undefined}
                          >
                            {blogTag.tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-gray-600 mb-3 line-clamp-3">
                      {getExcerpt(story.content)}
                    </p>

                    {/* Story Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{story.viewCount}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{story.likeCount}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{story.commentCount}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    {story.published && (
                      <Link
                        to={`/blog/${story.id}`}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors text-center"
                      >
                        View
                      </Link>
                    )}
                    
                    <Link
                      to={`/publish?edit=${story.id}`}
                      className="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-200 rounded hover:bg-green-50 transition-colors text-center"
                    >
                      Edit
                    </Link>
                    
                    <button
                      onClick={() => deleteStory(story.id)}
                      disabled={deleteLoading === story.id}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deleteLoading === story.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter === 'all' ? 'No stories yet' : 
               filter === 'published' ? 'No published stories' : 'No drafts'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'Get started by writing your first story.' :
               filter === 'published' ? 'Publish some stories to see them here.' : 'Create some drafts to see them here.'}
            </p>
            <div className="mt-6">
              <Link
                to="/publish"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Write your first story
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default MyStories; 