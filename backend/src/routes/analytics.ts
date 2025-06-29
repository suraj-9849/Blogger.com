import { Hono } from "hono";
import { createPrismaClient } from '../config/prisma';
import { verify } from "hono/jwt";

interface CustomBindings {
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: number;
  };
}

interface AnalyticsData {
  views: number;
  likes: number;
  comments: number;
  blog: any; // Replace with proper Blog type if available
}

interface Author {
  id: number;
  name: string;
  username: string;
}

export const analyticsRouter = new Hono<CustomBindings>();

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

// Get Dashboard Analytics
analyticsRouter.get("/dashboard", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId") as number;

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Get user's blog stats with real data
    const [totalBlogs, publishedBlogs, userBlogs, totalLikes, totalComments, followers] = await Promise.all([
      prisma.blog.count({ where: { authorId: userId } }),
      prisma.blog.count({ where: { authorId: userId, published: true } }),
      prisma.blog.findMany({ 
        where: { authorId: userId },
        select: { id: true, viewCount: true }
      }),
      prisma.like.count({ 
        where: { 
          blog: { authorId: userId } 
        } 
      }),
      prisma.comment.count({ 
        where: { 
          blog: { authorId: userId } 
        } 
      }),
      prisma.follow.count({ where: { followingId: userId } })
    ]);

    // Calculate total views from real data
    const totalViews = userBlogs.reduce((sum, blog) => sum + blog.viewCount, 0);

    // Recent blogs performance with real data
    const recentBlogs = await prisma.blog.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        published: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Get real chart data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentViews = await prisma.view.groupBy({
      by: ['createdAt'],
      where: {
        blog: { authorId: userId },
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true }
    });

    const recentLikes = await prisma.like.groupBy({
      by: ['createdAt'],
      where: {
        blog: { authorId: userId },
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true }
    });

    const recentCommentsData = await prisma.comment.groupBy({
      by: ['createdAt'],
      where: {
        blog: { authorId: userId },
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true }
    });

    // Top performing blogs with real data
    const topPerformingBlogs = await prisma.blog.findMany({
      where: { authorId: userId, published: true },
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        commentCount: true
      },
      orderBy: { viewCount: 'desc' },
      take: 3
    });

    const analytics = {
      overview: {
        totalBlogs,
        publishedBlogs,
        totalViews,
        totalLikes,
        totalComments,
        totalFollowers: followers
      },
      recentActivity: recentBlogs,
      chartData: {
        views: recentViews.map(v => v._count.id),
        likes: recentLikes.map(l => l._count.id),
        comments: recentCommentsData.map(c => c._count.id)
      },
      topPerformingBlogs: topPerformingBlogs.map(blog => ({
        ...blog,
        engagementRate: blog.viewCount > 0 ? Math.round(((blog.likeCount + blog.commentCount) / blog.viewCount) * 100) : 0
      }))
    };

    return c.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    console.error("Error fetching dashboard analytics:", error);
    return c.json({
      success: false,
      error: "Failed to fetch dashboard analytics"
    }, 500);
  }
});

// Get Global Platform Analytics
analyticsRouter.get("/platform", async (c) => {
  try {
    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    const [totalUsers, totalBlogs, totalPublishedBlogs, totalViews, totalLikes, totalComments] = await Promise.all([
      prisma.user.count(),
      prisma.blog.count(),
      prisma.blog.count({ where: { published: true } }),
      prisma.view.count(),
      prisma.like.count(),
      prisma.comment.count()
    ]);

    // Get top authors (by blog count) with real data
    const topAuthors = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        _count: {
          select: {
            blogs: true,
            followers: true
          }
        }
      },
      orderBy: {
        blogs: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Get top authors with their total views
    const topAuthorsWithViews = await Promise.all(
      topAuthors.map(async (author) => {
        const userViews = await prisma.view.count({
          where: { blog: { authorId: author.id } }
        });
        return {
          ...author,
          totalViews: userViews,
          avgEngagement: author._count.blogs > 0 ? Math.round(userViews / author._count.blogs) : 0
        };
      })
    );

    // Recent blogs with real data
    const recentBlogs = await prisma.blog.findMany({
      where: { published: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
        author: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // Get growth metrics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [usersGrowth, blogsGrowth, engagementGrowth] = await Promise.all([
      prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true }
      }),
      prisma.blog.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true }
      }),
      prisma.like.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true }
      })
    ]);

    const platformAnalytics = {
      overview: {
        totalUsers,
        totalBlogs,
        totalPublishedBlogs,
        totalViews,
        totalLikes,
        totalComments
      },
      topAuthors: topAuthorsWithViews,
      recentActivity: recentBlogs,
      growthMetrics: {
        usersGrowth: usersGrowth.map(u => u._count.id),
        blogsGrowth: blogsGrowth.map(b => b._count.id),
        engagementGrowth: engagementGrowth.map(e => e._count.id)
      }
    };

    return c.json({
      success: true,
      data: platformAnalytics
    });

  } catch (error: any) {
    console.error("Error fetching platform analytics:", error);
    return c.json({
      success: false,
      error: "Failed to fetch platform analytics"
    }, 500);
  }
});

// Get Trending Data
analyticsRouter.get("/trending", async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query("limit") || '10'), 20);

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Get trending blogs based on engagement (likes + comments + views)
    const trendingBlogs = await prisma.blog.findMany({
      where: { published: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      take: limit,
      orderBy: [
        { likeCount: 'desc' },
        { commentCount: 'desc' },
        { viewCount: 'desc' }
      ]
    });

    // Get trending tags from actual blog-tag relationships
    const trendingTags = await prisma.tag.findMany({
      select: {
        name: true,
        _count: {
          select: {
            blogs: true
          }
        }
      },
      orderBy: {
        blogs: {
          _count: 'desc'
        }
      },
      take: limit
    });

    // Get trending authors based on recent engagement
    const trendingAuthors = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        _count: {
          select: {
            blogs: true,
            followers: true
          }
        }
      },
      take: limit,
      orderBy: [
        { followers: { _count: 'desc' } },
        { blogs: { _count: 'desc' } }
      ]
    });

    // Get real engagement stats
    const totalEngagement = await Promise.all([
      prisma.like.count(),
      prisma.comment.count(),
      prisma.view.count()
    ]);

    const trendingData = {
      blogs: trendingBlogs.map(blog => ({
        ...blog,
        trendingScore: blog.likeCount + blog.commentCount + Math.floor(blog.viewCount / 10)
      })),
      tags: trendingTags.map(tag => ({
        name: tag.name,
        posts: tag._count.blogs,
        growth: tag._count.blogs // Using post count as growth indicator
      })),
      authors: trendingAuthors,
      stats: {
        totalTrendingPosts: trendingBlogs.length,
        totalEngagement: totalEngagement.reduce((sum, count) => sum + count, 0),
        growthRate: trendingBlogs.reduce((sum, blog) => sum + blog.likeCount + blog.commentCount, 0)
      }
    };

    return c.json({
      success: true,
      data: trendingData
    });

  } catch (error: any) {
    console.error("Error fetching trending data:", error);
    return c.json({
      success: false,
      error: "Failed to fetch trending data"
    }, 500);
  }
}); 