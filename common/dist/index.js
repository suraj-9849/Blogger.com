import { z } from "zod";
// ============ USER SCHEMAS ============
export const signupInput = z.object({
    name: z.string().optional(),
    username: z.string().min(3).max(30),
    email: z.string().email().optional(),
    password: z.string().min(6)
});
export const signinInput = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});
export const updateProfileInput = z.object({
    name: z.string().optional(),
    bio: z.string().max(160).optional(),
    website: z.string().url().optional(),
    location: z.string().max(50).optional(),
    avatar: z.string().url().optional()
});
// ============ BLOG SCHEMAS ============
export const createBlogInput = z.object({
    title: z.string().min(1).max(100),
    content: z.string().min(1),
    excerpt: z.string().max(300).optional(),
    thumbnail: z.string().url().optional(),
    tags: z.array(z.string()).max(5).optional(),
    published: z.boolean().default(false),
    featured: z.boolean().default(false)
});
export const updateBlogInput = z.object({
    id: z.number(),
    title: z.string().min(1).max(100).optional(),
    content: z.string().min(1).optional(),
    excerpt: z.string().max(300).optional(),
    thumbnail: z.string().url().optional(),
    tags: z.array(z.string()).max(5).optional(),
    published: z.boolean().optional(),
    featured: z.boolean().optional()
});
export const blogQueryInput = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(10),
    search: z.string().optional(),
    tag: z.string().optional(),
    author: z.string().optional(),
    sortBy: z.enum(['latest', 'popular', 'trending', 'oldest']).default('latest'),
    published: z.boolean().optional()
});
// ============ COMMENT SCHEMAS ============
export const createCommentInput = z.object({
    blogId: z.number(),
    content: z.string().min(1).max(1000),
    parentId: z.number().optional()
});
export const updateCommentInput = z.object({
    id: z.number(),
    content: z.string().min(1).max(1000)
});
// ============ TAG SCHEMAS ============
export const createTagInput = z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(200).optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
});
// ============ SEARCH SCHEMAS ============
export const searchInput = z.object({
    query: z.string().min(1),
    type: z.enum(['blogs', 'users', 'tags', 'all']).default('all'),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(10)
});
// ============ UTILITY FUNCTIONS ============
export const createSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};
export const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
};
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
export const getExcerpt = (content, maxLength = 150) => {
    if (content.length <= maxLength)
        return content;
    return content.slice(0, maxLength).trim() + '...';
};
export const signUpSchema = signupInput;
export const signInSchema = signinInput;
export const createBlogSchema = createBlogInput;
export const updateBlogSchema = updateBlogInput;
