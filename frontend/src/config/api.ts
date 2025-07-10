const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const API_ENDPOINTS = {
  USER: {
    SIGNIN: `${API_BASE_URL}/api/v1/user/signin`,
    SIGNUP: `${API_BASE_URL}/api/v1/user/signup`,
    ME: `${API_BASE_URL}/api/v1/user/me`,
    PROFILE: `${API_BASE_URL}/api/v1/user/profile`,
    BLOGS: (username: string) => `${API_BASE_URL}/api/v1/user/blogs/${username}`,
  },
  
  BLOG: {
    LIST: `${API_BASE_URL}/api/v1/blog`,
    MY_BLOGS: `${API_BASE_URL}/api/v1/blog/my/blogs`,
    TRENDING: `${API_BASE_URL}/api/v1/blog/trending`,
    SEARCH: (query: string) => `${API_BASE_URL}/api/v1/blog/search/${encodeURIComponent(query)}`,
    DETAIL: (id: string | number) => `${API_BASE_URL}/api/v1/blog/${id}`,
    VIEW: (id: string | number) => `${API_BASE_URL}/api/v1/blog/${id}/view`,
    LIKE: (id: string | number) => `${API_BASE_URL}/api/v1/blog/${id}/like`,
    COMMENTS: (id: string | number) => `${API_BASE_URL}/api/v1/blog/${id}/comments`,
  },
  
  TAG: {
    SEARCH: (query: string) => `${API_BASE_URL}/api/v1/tag/search/${encodeURIComponent(query)}`,
  },
  
  BOOKMARK: {
    LIST: `${API_BASE_URL}/api/v1/bookmark`,
    TOGGLE: (blogId: string | number) => `${API_BASE_URL}/api/v1/bookmark/${blogId}`,
  },
  
  UPLOAD: {
    IMAGE: `${API_BASE_URL}/api/v1/upload/image`,
  },
};

export const getHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
};

export const api = {
  get: async (url: string, token?: string) => {
    const response = await fetch(url, {
      headers: getHeaders(token),
    });
    return handleResponse(response);
  },
  
  post: async (url: string, body: any, token?: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
  
  put: async (url: string, body: any, token?: string) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
  
  delete: async (url: string, token?: string) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return handleResponse(response);
  },
}; 