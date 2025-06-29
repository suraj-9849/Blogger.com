import { Hono } from 'hono';
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';
import { tagRouter } from './routes/tag';
import { analyticsRouter } from './routes/analytics';
import { uploadRouter } from './routes/upload';
import { bookmarkRouter } from './routes/bookmark';
import { cors } from 'hono/cors';

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_BUCKET_NAME: string;
    }
}>();

app.use('/*', cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://yourdomain.com',
    'https://blogger-com.vercel.app'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Blogger.com API is running',
    version: '1.0.0',
    endpoints: {
      users: '/api/v1/user',
      blogs: '/api/v1/blog',
      tags: '/api/v1/tag',
      analytics: '/api/v1/analytics',
      bookmarks: '/api/v1/bookmark'
    }
  });
});

app.get('/api/v1', (c) => {
  return c.json({
    success: true,
    message: 'Blogger.com API v1',
    documentation: 'https://docs.blogger.com/api/v1',
    routes: [
      'GET /api/v1/user/me - Get current user profile',
      'POST /api/v1/user/signup - Create new account',
      'POST /api/v1/user/signin - Sign in to account',
      'GET /api/v1/user/profile/:username - Get user profile',
      'GET /api/v1/user/blogs/:username - Get user blogs',
      
      'GET /api/v1/blog - Get all blogs with filters',
      'POST /api/v1/blog - Create new blog post',
      'PUT /api/v1/blog - Update blog post',
      'GET /api/v1/blog/trending - Get trending blogs',
      'GET /api/v1/blog/:id - Get single blog',
      'DELETE /api/v1/blog/:id - Delete blog',
      'GET /api/v1/blog/my/blogs - Get user\'s own blogs',
      'GET /api/v1/blog/search/:query - Search blogs',
      'GET /api/v1/blog/analytics/:id - Get blog analytics',
      
      'GET /api/v1/tag - Get all tags',
      'GET /api/v1/tag/popular - Get popular tags',
      'GET /api/v1/tag/search/:query - Search tags',
      
      'GET /api/v1/analytics/dashboard - Get dashboard analytics',
      'GET /api/v1/analytics/platform - Get platform analytics',
      'GET /api/v1/analytics/trending - Get trending data',

      'GET /api/v1/bookmark - Get user\'s bookmarks',
      'POST /api/v1/bookmark/:id - Toggle bookmark',
      'GET /api/v1/bookmark/:id - Check if blog is bookmarked'
    ]
  });
});

app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogRouter);
app.route("/api/v1/tag", tagRouter);
app.route("/api/v1/analytics", analyticsRouter);
app.route("/api/v1/upload", uploadRouter);
app.route("/api/v1/bookmark", bookmarkRouter);

app.onError((err, c) => {
  console.error('Global error:', err);
  
  return c.json({
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong'
  }, 500);
});
  
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: [
      '/api/v1/user',
      '/api/v1/blog', 
      '/api/v1/tag',
      '/api/v1/analytics',
      '/api/v1/bookmark'
    ]
  }, 404);
});

export default app;