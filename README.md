# Blogger Platform

A modern blogging platform with rich features.

## Features

- User authentication and profiles
- Create, edit, and delete blog posts
- Tag-based categorization
- Search by title, content, tags, or author
- Bookmark favorite posts
- Like and comment system
- Analytics dashboard
- Responsive design

## Tech Stack

Backend:
- Node.js with Hono
- PostgreSQL with Prisma ORM
- JWT Authentication
- Docker containerization
- AWS S3 Bucket

Frontend:
- React with Vite
- TypeScript
- Tailwind CSS
- React Router

## API Endpoints

### Blogs
- `POST /api/v1/blog` - Create blog
- `GET /api/v1/blog/:id` - Get blog
- `PUT /api/v1/blog/:id` - Update blog
- `DELETE /api/v1/blog/:id` - Delete blog
- `GET /api/v1/blog/search` - Search blogs

### Tags
- `GET /api/v1/tag` - Get all tags
- `GET /api/v1/tag/popular` - Get popular tags
- `GET /api/v1/tag/:slug` - Get blogs by tag

### Users
- `GET /api/v1/user/profile/:username` - Get profile
- `PUT /api/v1/user/profile` - Update profile
- `GET /api/v1/user/blogs/:username` - Get user's blogs

### Bookmarks
- `POST /api/v1/bookmark/:id` - Toggle bookmark
- `GET /api/v1/bookmark` - Get bookmarks
- `GET /api/v1/bookmark/:id` - Check bookmark status

## Setup

1. Clone repository
2. Set up environment variables:

Backend (.env):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/blogger
JWT_SECRET=your-jwt-secret
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
AWS_BUCKET_NAME=""
```

Frontend (.env):
```
VITE_BACKEND_URL=http://localhost:8787
```

3. Install dependencies:
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

4. Start development servers:
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## Docker Deployment

1. Set environment variables in .env file
2. Build and run containers:
```bash
docker-compose up -d
```

Access the application:
- Frontend: http://localhost:3000
- Backend: http://localhost:8787

## Database Schema

Core entities:
- Users: User accounts and profiles
- Blogs: Blog posts with metadata
- Tags: Content categorization
- Comments: Nested commenting
- Bookmarks: Saved posts
- Analytics: Usage statistics 