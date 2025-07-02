  import { Hono } from "hono";
import { createPrismaClient } from '../config/prisma';
import { sign, verify } from 'hono/jwt'
import { hash, compare } from 'bcryptjs'
import { 
  signUpSchema, 
  signInSchema,
  ApiResponse,
  User,
  updateBlogSchema,
  Blog
} from "@suraj-9849/common";

  export const userRouter = new Hono<{
      Bindings: {
          DATABASE_URL: string;
          JWT_SECRET: string;
      }
    Variables: {
        userId: number;
    }
  }>();

// Middleware for protected routes
const authMiddleware = async (c: any, next: any) => {
    const authHeader = c.req.header("authorization") || "";
    const token = authHeader.split(" ")[1];
    
    if (!token) {
        return c.json({ 
            success: false, 
            error: "No token provided" 
        }, 401);
    }

    try {
        const user = await verify(token, c.env.JWT_SECRET);
        if (user && user.id) {
            c.set("userId", user.id as number);
            await next();
        } else {
            return c.json({ 
                success: false, 
                error: "Invalid token" 
            }, 401);
        }
    } catch (e: any) {
        return c.json({ 
            success: false, 
            error: "Authentication failed" 
        }, 401);
    }
};

// User Signup
userRouter.post('/signup', async (c) => {
    try {
        const body = await c.req.json();
        const validation = signUpSchema.safeParse(body);
        
        if (!validation.success) {
            return c.json({ 
                success: false, 
                error: "Invalid input data",
                message: validation.error.errors.map(e => e.message).join(", ")
            }, 400);
        }

        const { name, username, password } = validation.data;

        const prisma = createPrismaClient(c.env.DATABASE_URL);

        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            return c.json({ 
                success: false, 
                error: "User already exists with this username" 
            }, 409);
        }

        const hashedPassword = await hash(password, 12);

        const user = await prisma.user.create({
          data: {
                name,
                username,
                email: `${username}@blogger.com`,
                password: hashedPassword
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true
            }
        });

        const jwt = await sign({
            id: user.id,
            exp: Math.floor(Date.now() / 1000) + (5 * 24 * 60 * 60) //5days
        }, c.env.JWT_SECRET);
    
        return c.json({
            success: true,
            data: {
                user,
                token: jwt
            },
            message: "Account created successfully"
        }, 201);

    } catch (error: any) {
        console.error("Signup error:", error);
        return c.json({ 
            success: false, 
            error: "Internal server error" 
        }, 500);
    }
});

// User Signin
    userRouter.post('/signin', async (c) => {
    try {
      const body = await c.req.json();
        
        // Use email for signin as per the schema
        if (!body.email || !body.password) {
            return c.json({ 
                success: false, 
                error: "Email and password are required" 
            }, 400);
        }

        const { email, password } = body;

        // Create Prisma client with environment variable
        const prisma = createPrismaClient(c.env.DATABASE_URL);

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                password: true,
                _count: {
                    select: {
                        blogs: true
                    }
                }
            }
        });

        if (!user) {
            return c.json({ 
                success: false, 
                error: "Invalid credentials" 
            }, 401);
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
            return c.json({ 
                success: false, 
                error: "Invalid credentials" 
            }, 401);
        }

        const jwt = await sign({ 
            id: user.id,
            exp: Math.floor(Date.now() / 1000) + (5 * 24 * 60 * 60) // 5days
        }, c.env.JWT_SECRET);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return c.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token: jwt
            },
            message: "Signed in successfully"
        });

    } catch (error: any) {
        console.error("Signin error:", error);
        return c.json({ 
            success: false, 
            error: "Internal server error" 
        }, 500);
    }
});

// Get Current User Profile
userRouter.get('/me', authMiddleware, async (c) => {
    try {
        const userId = c.get("userId");

        // Create Prisma client with environment variable
        const prisma = createPrismaClient(c.env.DATABASE_URL);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                bio: true,
                avatar: true,
                verified: true,
                _count: {
                    select: {
                        blogs: true,
                        followers: true,
                        following: true
                    }
                }
            }
        });

        if (!user) {
            return c.json({ 
                success: false, 
                error: "User not found" 
            }, 404);
        }

        return c.json({
            success: true,
            data: user
        });

    } catch (error: any) {
        console.error("Get profile error:", error);
        return c.json({ 
            success: false, 
            error: "Internal server error" 
        }, 500);
    }
});

// Get User Profile by Username
userRouter.get('/profile/:username', async (c) => {
    try {
        const username = c.req.param('username');

        // Create Prisma client with environment variable
        const prisma = createPrismaClient(c.env.DATABASE_URL);

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                bio: true,
                avatar: true,
                verified: true,
                _count: {
                    select: {
                        blogs: true,
                        followers: true,
                        following: true
                    }
                }
            }
        });

        if (!user) {
            return c.json({ 
                success: false, 
                error: "User not found" 
            }, 404);
        }

        return c.json({
            success: true,
            data: user
        });

    } catch (error: any) {
        console.error("Get user profile error:", error);
        return c.json({ 
            success: false, 
            error: "Internal server error" 
        }, 500);
    }
});

// Get User's Blogs
userRouter.get('/blogs/:username', async (c) => {
    try {
        const username = c.req.param('username');
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '10');
        const skip = (page - 1) * limit;

        // Create Prisma client with environment variable
        const prisma = createPrismaClient(c.env.DATABASE_URL);

        // First find the user
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return c.json({ 
                success: false, 
                error: "User not found" 
            }, 404);
        }

        // Get user's blogs
        const blogs = await prisma.blog.findMany({
            where: { 
                authorId: user.id,
                published: true 
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.blog.count({
            where: { 
                authorId: user.id,
                published: true 
            }
        });

        return c.json({
            success: true,
            data: blogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Get user blogs error:", error);
        return c.json({ 
            success: false, 
            error: "Internal server error" 
        }, 500);
    }
});

// Update User Profile
userRouter.put('/profile', authMiddleware, async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        
        // Create Prisma client with environment variable
        const prisma = createPrismaClient(c.env.DATABASE_URL);
        
        // Simple validation for profile update
        const allowedFields = ['name', 'bio', 'avatar', 'website', 'location'];
        const updateData: any = {};
        
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                bio: true,
                avatar: true,
                website: true,
                location: true,
                verified: true
            }
        });

        return c.json({
            success: true,
            data: updatedUser,
            message: "Profile updated successfully"
        });

    } catch (error: any) {
        console.error("Update profile error:", error);
        return c.json({ 
            success: false, 
            error: "Internal server error" 
        }, 500);
    }
});

// Follow/Unfollow User
userRouter.post('/follow/:userId', authMiddleware, async (c) => {
    try {
        const followerId = c.get("userId");
        const followingId = parseInt(c.req.param('userId'));

        if (followerId === followingId) {
            return c.json({ 
                success: false, 
                error: "Cannot follow yourself" 
            }, 400);
        }

        // Create Prisma client with environment variable
        const prisma = createPrismaClient(c.env.DATABASE_URL);

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId
                }
            }
        });

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId
                    }
                }
            });

            return c.json({
                success: true,
                message: "Unfollowed successfully"
            });
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerId,
                    followingId
                }
            });

          return c.json({
                success: true,
                message: "Followed successfully"
            });
        }

    } catch (error: any) {
        console.error("Follow/Unfollow error:", error);
        return c.json({ 
            success: false, 
            error: "Internal server error" 
        }, 500);
    }
});

// Get User Followers
userRouter.get('/followers/:userId', async (c) => {
    try {
        const userId = parseInt(c.req.param('userId'));
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '20');
        const skip = (page - 1) * limit;

        // Create Prisma client with environment variable
        const prisma = createPrismaClient(c.env.DATABASE_URL);

        const followers = await prisma.follow.findMany({
            where: { followingId: userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        verified: true,
                        bio: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.follow.count({
            where: { followingId: userId }
        });

        return c.json({
            success: true,
            data: followers.map((f: { follower: any; }) => f.follower),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Get followers error:", error);
        return c.json({ 
            success: false, 
            error: "Internal server error" 
        }, 500);
    }
});

// Get User Following
userRouter.get('/following/:userId', async (c) => {
    try {
        const userId = parseInt(c.req.param('userId'));
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '20');
        const skip = (page - 1) * limit;

        // Create Prisma client with environment variable
        const prisma = createPrismaClient(c.env.DATABASE_URL);

        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        verified: true,
                        bio: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.follow.count({
            where: { followerId: userId }
        });

        return c.json({
            success: true,
            data: following.map((f: { following: any; }) => f.following),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Get following error:", error);
        return c.json<ApiResponse>({ 
            success: false, 
            error: "Internal server error" 
        }, 500);
    }
});