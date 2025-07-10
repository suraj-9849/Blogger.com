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
    const skip = (page - 1) * limit;

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Get all tags without pagination for debugging
    const allTags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
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
      }
    });

    console.log('Available tags:', allTags);

    const [tags, totalCount] = await Promise.all([
      prisma.tag.findMany({
        select: {
          name: true,
          _count: {
            select: {
              blogs: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          blogs: {
            _count: 'desc'
          }
        }
      }),
      prisma.tag.count()
    ]);

    const formattedTags = tags.map(tag => ({
      name: tag.name,
      count: tag._count.blogs
    }));

    return c.json({
      success: true,
      data: formattedTags,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
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

// Get blogs by tag name (must be last)
tagRouter.get("/:tagName", async (c) => {
  try {
    const tagName = decodeURIComponent(c.req.param("tagName"));
    const page = parseInt(c.req.query("page") || '1');
    const limit = Math.min(parseInt(c.req.query("limit") || '10'), 20);
    const skip = (page - 1) * limit;

    console.log('Looking for tag:', tagName);

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // First find the tag (case insensitive)
    const tag = await prisma.tag.findFirst({
      where: {
        name: {
          mode: 'insensitive',
          equals: tagName
        }
      }
    });

    console.log('Found tag:', tag);

    if (!tag) {
      return c.json({
        success: false,
        error: "Tag not found"
      }, 404);
    }

    // Get blogs with the specified tag
    const [blogs, totalCount] = await Promise.all([
      prisma.blog.findMany({
        where: {
          tags: {
            some: {
              tagId: tag.id
            }
          },
          published: true
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          thumbnail: true,
          excerpt: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          readTime: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          bookmarkCount: true,
          author: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          tags: {
            select: {
              id: true,
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true
                }
              }
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.blog.count({
        where: {
          tags: {
            some: {
              tagId: tag.id
            }
          },
          published: true
        }
      })
    ]);

    // Add debug logging
    console.log('Found blogs:', blogs);

    return c.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching blogs by tag:", error);
    return c.json({
      success: false,
      error: "Failed to fetch blogs by tag"
    }, 500);
  }
}); 