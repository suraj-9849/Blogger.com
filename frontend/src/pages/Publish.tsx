import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';

interface PublishProps {
  isAuthenticated?: boolean;
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  } | null;
}

function Publish({ isAuthenticated, user }: PublishProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const [blogInputs, setBlogInputs] = useState({
    title: "",
    content: "",
    thumbnail: "",
    tags: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [blogLoading, setBlogLoading] = useState(false);

  // Check if we're editing and fetch blog data
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setEditingBlogId(parseInt(editId));
      fetchBlogForEdit(parseInt(editId));
    }
  }, [searchParams]);

  const fetchBlogForEdit = async (blogId: number) => {
    setBlogLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog/${blogId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const blog = data.data;
          setBlogInputs({
            title: blog.title,
            content: blog.content,
            thumbnail: blog.thumbnail || "",
            tags: blog.tags ? blog.tags.map((blogTag: any) => blogTag.tag.name) : []
          });
        } else {
          setError("Failed to fetch blog data");
        }
      } else {
        setError("Failed to fetch blog data");
      }
    } catch (err) {
      setError("Failed to fetch blog data");
    } finally {
      setBlogLoading(false);
    }
  };

  // Tag handling functions
  const searchTags = async (query: string) => {
    if (query.length < 2) {
      setSuggestedTags([]);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/tag/search/${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuggestedTags(data.data.map((tag: any) => tag.name));
        }
      }
    } catch (e) {
      console.error("Error searching tags:", e);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !blogInputs.tags.includes(trimmedTag) && blogInputs.tags.length < 5) {
      setBlogInputs({
        ...blogInputs,
        tags: [...blogInputs.tags, trimmedTag]
      });
      setTagInput("");
      setSuggestedTags([]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setBlogInputs({
      ...blogInputs,
      tags: blogInputs.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    }
  };

  const publishBlog = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const requestBody = {
        title: blogInputs.title,
        content: blogInputs.content,
        thumbnail: blogInputs.thumbnail || undefined,
        published: true,
        tags: blogInputs.tags,
        ...(isEditing && editingBlogId ? { id: editingBlogId } : {})
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/blog`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const json = await response.json();
        console.log("Blog operation response:", json);
        if (json.success && json.data && json.data.id) {
          navigate(`/blog/${json.data.id}`);
        } else {
          console.error("Invalid response structure:", json);
          setError(`Failed to get blog ID after ${isEditing ? 'updating' : 'publishing'}`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${isEditing ? 'update' : 'publish'} blog`);
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    setImageUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.url) {
          insertImageAtCursor(json.data.url, file.name);
        } else {
          setError("Failed to get image URL after upload");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to upload image");
      }
    } catch (e) {
      setError("Something went wrong uploading the image.");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const insertImageAtCursor = (imageUrl: string, altText: string) => {
    const textarea = contentTextAreaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBefore = blogInputs.content.substring(0, cursorPosition);
    const textAfter = blogInputs.content.substring(cursorPosition);
    
    const imageMarkdown = `\n\n![${altText}](${imageUrl})\n\n`;
    const newContent = textBefore + imageMarkdown + textAfter;

    setBlogInputs({
      ...blogInputs,
      content: newContent
    });

    setTimeout(() => {
      const newCursorPosition = cursorPosition + imageMarkdown.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      textarea.focus();
    }, 0);
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG, PNG, and WebP are allowed for thumbnails.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Thumbnail too large. Maximum size is 2MB.");
      return;
    }

    setThumbnailUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.url) {
          setBlogInputs({
            ...blogInputs,
            thumbnail: json.data.url
          });
        } else {
          setError("Failed to get thumbnail URL after upload");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to upload thumbnail");
      }
    } catch (e) {
      setError("Something went wrong uploading the thumbnail.");
    } finally {
      setThumbnailUploading(false);
    }
  };

  const insertFormatting = (format: string) => {
    const textarea = contentTextAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = blogInputs.content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText || 'underlined text'}</u>`;
        break;
      case 'heading':
        formattedText = `## ${selectedText || 'Heading'}`;
        break;
      case 'heading3':
        formattedText = `### ${selectedText || 'Subheading'}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'Quote'}`;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        break;
      case 'codeblock':
        formattedText = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](https://example.com)`;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'list item'}`;
        break;
      case 'numberedlist':
        formattedText = `1. ${selectedText || 'numbered item'}`;
        break;
    }

    const newContent = 
      blogInputs.content.substring(0, start) + 
      formattedText + 
      blogInputs.content.substring(end);

    setBlogInputs({
      ...blogInputs,
      content: newContent
    });

    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = start + formattedText.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const renderPreview = () => {
    if (!previewMode) return null;
    
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
            <div key={index} className="my-6">
              <img 
                src={src} 
                alt={alt} 
                className="w-full max-w-full h-auto rounded-lg shadow-lg"
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
            <h2 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-3">
              {line.replace('## ', '')}
            </h2>
          );
          index++;
          continue;
        }

        if (line.startsWith('### ')) {
          elements.push(
            <h3 key={index} className="text-xl font-semibold text-gray-900 mt-4 mb-2">
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
            <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
              <code>{codeLines.join('\n')}</code>
            </pre>
          );
          index++;
          continue;
        }

        if (line.startsWith('> ')) {
          elements.push(
            <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-3">
              {line.replace('> ', '')}
            </blockquote>
          );
          index++;
          continue;
        }

        if (line.match(/^[\d]+\.\s/)) {
          elements.push(
            <ol key={index} className="list-decimal list-inside my-2">
              <li>{line.replace(/^[\d]+\.\s/, '')}</li>
            </ol>
          );
          index++;
          continue;
        }

        if (line.startsWith('- ')) {
          elements.push(
            <ul key={index} className="list-disc list-inside my-2">
              <li>{line.replace('- ', '')}</li>
            </ul>
          );
          index++;
          continue;
        }

        let processedLine = line;
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedLine = processedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
        processedLine = processedLine.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
        processedLine = processedLine.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
        processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

        elements.push(
          <p key={index} className="text-gray-700 leading-relaxed mb-3" 
             dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
        index++;
      }

      return elements;
    };

    return (
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-6">{blogInputs.title || 'Your Title Here'}</h1>
        {blogInputs.thumbnail && (
          <div className="mb-6">
            <img 
              src={blogInputs.thumbnail} 
              alt="Blog thumbnail" 
              className="w-full max-w-2xl h-auto rounded-lg shadow-lg"
            />
          </div>
        )}
        <div className="mt-4">
          {renderMarkdownContent(blogInputs.content)}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Edit your story' : 'Write a story'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Update your story and reach more readers' : 'Share your ideas with the world'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {blogLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading blog for editing...
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <textarea
              placeholder="Title"
              className="w-full text-4xl font-bold placeholder-gray-400 border-none outline-none resize-none overflow-hidden bg-transparent"
              rows={1}
              style={{ minHeight: '80px' }}
              value={blogInputs.title}
              onChange={(e) => {
                setBlogInputs({
                  ...blogInputs,
                  title: e.target.value
                });
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>

          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Blog Thumbnail</h3>
              <button
                type="button"
                onClick={() => document.getElementById('thumbnail-input')?.click()}
                disabled={thumbnailUploading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {thumbnailUploading ? 'Uploading...' : blogInputs.thumbnail ? 'Change' : 'Upload'}
              </button>
            </div>
            
            {blogInputs.thumbnail ? (
              <div className="relative">
                <img 
                  src={blogInputs.thumbnail} 
                  alt="Blog thumbnail" 
                  className="w-full max-w-sm h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setBlogInputs({ ...blogInputs, thumbnail: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-full max-w-sm h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 mt-1">Add thumbnail</p>
                </div>
              </div>
            )}
            
            <input
              id="thumbnail-input"
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">Recommended: 1200x630px, max 2MB</p>
          </div>

          <div className="flex items-center justify-between py-3 border-y border-gray-200">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => insertFormatting('bold')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Bold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => insertFormatting('italic')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Italic"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4l4 16" />
                </svg>
              </button>

              <button
                type="button"  
                onClick={() => insertFormatting('underline')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Underline"
              >
                <span className="text-sm font-medium underline">U</span>
              </button>

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              <button
                type="button"
                onClick={() => insertFormatting('heading')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Heading"
              >
                <span className="text-sm font-bold">H1</span>
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('heading3')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Subheading"
              >
                <span className="text-sm font-bold">H2</span>
              </button>

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              <button
                type="button"
                onClick={() => insertFormatting('list')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Bullet List"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('numberedlist')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Numbered List"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              <button
                type="button"
                onClick={() => insertFormatting('code')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Inline Code"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('codeblock')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Code Block"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('quote')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Quote"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              {/* Link & Image */}
              <button
                type="button"
                onClick={() => insertFormatting('link')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                title="Upload Image"  
              >
                {imageUploading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  previewMode 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {previewMode ? 'Edit' : 'Preview'}  
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px]">
            {previewMode ? (
              <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                {renderPreview()}
              </div>
            ) : (
              <textarea
                ref={contentTextAreaRef}
                placeholder="Tell your story..."
                className="w-full text-lg placeholder-gray-400 border-none outline-none resize-none bg-transparent leading-relaxed"
                rows={20}
                style={{ minHeight: '400px' }}
                value={blogInputs.content}
                onChange={(e) => {
                  setBlogInputs({
                    ...blogInputs,
                    content: e.target.value
                  });
                }}
              />
            )}
          </div>

          {/* Tags Section */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Tags (optional)</h3>
            <p className="text-xs text-gray-500 mb-3">Add up to 5 tags to help readers discover your story</p>
            
            {/* Current Tags */}
            {blogInputs.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {blogInputs.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag Input */}
            {blogInputs.tags.length < 5 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type a tag and press Enter or comma"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    searchTags(e.target.value);
                  }}
                  onKeyPress={handleTagInputKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Tag Suggestions */}
                {suggestedTags.length > 0 && tagInput.length >= 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {suggestedTags.map((tag, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              Press Enter or comma to add a tag. {5 - blogInputs.tags.length} tags remaining.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <p>Supports Markdown formatting</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/blogs')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={publishBlog}
                disabled={loading || !blogInputs.title.trim() || !blogInputs.content.trim()}
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditing ? 'Updating...' : 'Publishing...'}
                  </div>
                ) : (
                  isEditing ? 'Update' : 'Publish'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Writing Guide */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Writing Guide</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Formatting</h4>
              <ul className="space-y-1">
                <li>• **Bold text** for emphasis</li>
                <li>• *Italic text* for style</li>
                <li>• ## Headings for structure</li>
                                 <li>• &gt; Quotes for emphasis</li>
                <li>• `Code` for technical terms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Best Practices</h4>
              <ul className="space-y-1">
                <li>• Write compelling titles</li>
                <li>• Use images to break up text</li>
                <li>• Keep paragraphs short</li>
                <li>• Add links to relevant sources</li>
                <li>• Proofread before publishing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Publish;
