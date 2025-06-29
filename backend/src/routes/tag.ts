import { Hono } from "hono";
import { createPrismaClient } from '../config/prisma';

export const tagRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();


// Get All Tags
tagRouter.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || '1');
    const limit = Math.min(parseInt(c.req.query("limit") || '20'), 50);

    return c.json({
      success: true,
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      }
    });

  } catch (error: any) {
    console.error("Error fetching tags:", error);
    return c.json({
      success: false,
      error: "Failed to fetch tags"
    }, 500);
  }
});

// Get Popular Tags
tagRouter.get("/popular", async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query("limit") || '10'), 20);

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    const popularTags = await prisma.tag.findMany({
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

    const formattedTags = popularTags.map(tag => ({
      name: tag.name,
      count: tag._count.blogs
    }));

    return c.json({
      success: true,
      data: formattedTags
    });

  } catch (error: any) {
    console.error("Error fetching popular tags:", error);
    return c.json({
      success: false,
      error: "Failed to fetch popular tags"
    }, 500);
  }
});

// Search Tags
tagRouter.get("/search/:query", async (c) => {
  try {
    const query = c.req.param("query").toLowerCase();

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Search real tags from database
    const matchingTags = await prisma.tag.findMany({
      where: {
        name: {
          contains: query
        }
      },
      select: {
        name: true,
        _count: {
          select: {
            blogs: true
          }
        }
      },
      take: 20
    });

    const formattedTags = matchingTags.map(tag => ({
      name: tag.name,
      count: tag._count.blogs
    }));

    return c.json({
      success: true,
      data: formattedTags
    });

  } catch (error: any) {
    console.error("Error searching tags:", error);
    return c.json({
      success: false,
      error: "Failed to search tags"
    }, 500);
  }
}); 