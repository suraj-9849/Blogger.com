import { z } from "zod";
export declare const signupInput: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    username: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    name?: string | undefined;
    email?: string | undefined;
}, {
    username: string;
    password: string;
    name?: string | undefined;
    email?: string | undefined;
}>;
export declare const signinInput: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const updateProfileInput: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    bio?: string | undefined;
    website?: string | undefined;
    location?: string | undefined;
    avatar?: string | undefined;
}, {
    name?: string | undefined;
    bio?: string | undefined;
    website?: string | undefined;
    location?: string | undefined;
    avatar?: string | undefined;
}>;
export declare const createBlogInput: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    excerpt: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    published: z.ZodDefault<z.ZodBoolean>;
    featured: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    content: string;
    published: boolean;
    featured: boolean;
    excerpt?: string | undefined;
    thumbnail?: string | undefined;
    tags?: string[] | undefined;
}, {
    title: string;
    content: string;
    excerpt?: string | undefined;
    thumbnail?: string | undefined;
    tags?: string[] | undefined;
    published?: boolean | undefined;
    featured?: boolean | undefined;
}>;
export declare const updateBlogInput: z.ZodObject<{
    id: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    published: z.ZodOptional<z.ZodBoolean>;
    featured: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: number;
    title?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    thumbnail?: string | undefined;
    tags?: string[] | undefined;
    published?: boolean | undefined;
    featured?: boolean | undefined;
}, {
    id: number;
    title?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    thumbnail?: string | undefined;
    tags?: string[] | undefined;
    published?: boolean | undefined;
    featured?: boolean | undefined;
}>;
export declare const blogQueryInput: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["latest", "popular", "trending", "oldest"]>>;
    published: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "latest" | "popular" | "trending" | "oldest";
    published?: boolean | undefined;
    search?: string | undefined;
    tag?: string | undefined;
    author?: string | undefined;
}, {
    published?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    tag?: string | undefined;
    author?: string | undefined;
    sortBy?: "latest" | "popular" | "trending" | "oldest" | undefined;
}>;
export declare const createCommentInput: z.ZodObject<{
    blogId: z.ZodNumber;
    content: z.ZodString;
    parentId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    content: string;
    blogId: number;
    parentId?: number | undefined;
}, {
    content: string;
    blogId: number;
    parentId?: number | undefined;
}>;
export declare const updateCommentInput: z.ZodObject<{
    id: z.ZodNumber;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    id: number;
}, {
    content: string;
    id: number;
}>;
export declare const createTagInput: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    color?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    color?: string | undefined;
}>;
export declare const searchInput: z.ZodObject<{
    query: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["blogs", "users", "tags", "all"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "tags" | "blogs" | "users" | "all";
    page: number;
    limit: number;
    query: string;
}, {
    query: string;
    type?: "tags" | "blogs" | "users" | "all" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type SignupInput = z.infer<typeof signupInput>;
export type SigninInput = z.infer<typeof signinInput>;
export type UpdateProfileInput = z.infer<typeof updateProfileInput>;
export type CreateBlogInput = z.infer<typeof createBlogInput>;
export type UpdateBlogInput = z.infer<typeof updateBlogInput>;
export type BlogQueryInput = z.infer<typeof blogQueryInput>;
export type CreateCommentInput = z.infer<typeof createCommentInput>;
export type UpdateCommentInput = z.infer<typeof updateCommentInput>;
export type CreateTagInput = z.infer<typeof createTagInput>;
export type SearchInput = z.infer<typeof searchInput>;
export interface User {
    id: number;
    name?: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    website?: string;
    location?: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        blogs: number;
        followers: number;
        following: number;
    };
}
export interface Blog {
    id: number;
    title: string;
    content: string;
    excerpt?: string;
    thumbnail?: string;
    slug: string;
    published: boolean;
    featured: boolean;
    readTime?: number;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    bookmarkCount: number;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    authorId: number;
    author: User;
    tags?: Tag[];
    isLiked?: boolean;
    isBookmarked?: boolean;
}
export interface BlogPost extends Blog {
    publishedDate?: string;
}
export interface Tag {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    createdAt: string;
    _count?: {
        blogs: number;
    };
}
export interface Comment {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: number;
    blogId: number;
    parentId?: number;
    user: User;
    replies?: Comment[];
}
export interface Analytics {
    id: number;
    date: string;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalUsers: number;
    totalBlogs: number;
    totalBookmarks: number;
}
export interface TrendingStats {
    topBlogs: Blog[];
    topTags: Tag[];
    topAuthors: User[];
    analytics: {
        views: number;
        likes: number;
        comments: number;
        newUsers: number;
        newBlogs: number;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
export declare const createSlug: (title: string) => string;
export declare const calculateReadTime: (content: string) => number;
export declare const formatDate: (date: string | Date) => string;
export declare const getExcerpt: (content: string, maxLength?: number) => string;
export type SignUpInput = SignupInput;
export type signInInput = SigninInput;
export type createBlogInput = CreateBlogInput;
export type updateBlogInput = UpdateBlogInput;
export declare const signUpSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    username: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    name?: string | undefined;
    email?: string | undefined;
}, {
    username: string;
    password: string;
    name?: string | undefined;
    email?: string | undefined;
}>;
export declare const signInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const createBlogSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    excerpt: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    published: z.ZodDefault<z.ZodBoolean>;
    featured: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    content: string;
    published: boolean;
    featured: boolean;
    excerpt?: string | undefined;
    thumbnail?: string | undefined;
    tags?: string[] | undefined;
}, {
    title: string;
    content: string;
    excerpt?: string | undefined;
    thumbnail?: string | undefined;
    tags?: string[] | undefined;
    published?: boolean | undefined;
    featured?: boolean | undefined;
}>;
export declare const updateBlogSchema: z.ZodObject<{
    id: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    published: z.ZodOptional<z.ZodBoolean>;
    featured: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: number;
    title?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    thumbnail?: string | undefined;
    tags?: string[] | undefined;
    published?: boolean | undefined;
    featured?: boolean | undefined;
}, {
    id: number;
    title?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    thumbnail?: string | undefined;
    tags?: string[] | undefined;
    published?: boolean | undefined;
    featured?: boolean | undefined;
}>;
