import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

interface SearchResult {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    name?: string;
    username: string;
  };
  publishedAt?: string;
  readTime?: number;
}

export const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchBlogs(query.trim());
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const searchBlogs = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/search/${encodeURIComponent(searchQuery)}?limit=8`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResults(data.data);
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleResultClick = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.blur();
  };

  const getExcerpt = (content: string, maxLength: number = 100) => {
    const text = content.replace(/[#*`>\[\]()]/g, '').replace(/\n/g, ' ');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search stories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <>
              {results.map((result) => (
                <Link
                  key={result.id}
                  to={`/blog/${result.id}`}
                  onClick={handleResultClick}
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                        {result.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {getExcerpt(result.content)}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span>{result.author.name || result.author.username}</span>
                        {result.publishedAt && (
                          <>
                            <span className="mx-1">·</span>
                            <span>{formatDate(result.publishedAt)}</span>
                          </>
                        )}
                        {result.readTime && (
                          <>
                            <span className="mx-1">·</span>
                            <span>{result.readTime} min read</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <Link
                  to={`/search?q=${encodeURIComponent(query)}`}
                  onClick={handleResultClick}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  See all results for "{query}"
                </Link>
              </div>
            </>
          ) : query.trim().length >= 2 && !loading ? (
            <div className="px-4 py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try searching for something else.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}; 