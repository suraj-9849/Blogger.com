import { Hono } from "hono";
import { createPrismaClient } from '../config/prisma';
import { authMiddleware } from '../middleware/auth';

export const bookmarkRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    authorId: number;
  };
}>();

// Toggle bookmark
bookmarkRouter.post('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const userId = c.get('authorId');
  const prisma = createPrismaClient(c.env.DATABASE_URL);

  try {
    const blog = await prisma.blog.findUnique({
      where: { id: parseInt(id) }
    });

    if (!blog) {
      return c.json({ success: false, error: 'Blog not found' }, 404);
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId: parseInt(id)
        }
      }
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          userId_blogId: {
            userId,
            blogId: parseInt(id)
          }
        }
      });

      await prisma.blog.update({
        where: { id: parseInt(id) },
        data: { bookmarkCount: { decrement: 1 } }
      });

      return c.json({ success: true, data: { bookmarked: false } });
    }

    // Add bookmark
    await prisma.bookmark.create({
      data: {
        userId,
        blogId: parseInt(id)
      }
    });

    await prisma.blog.update({
      where: { id: parseInt(id) },
      data: { bookmarkCount: { increment: 1 } }
    });

    return c.json({ success: true, data: { bookmarked: true } });
  } catch (error) {
    console.error('Error handling bookmark:', error);
    return c.json({ success: false, error: 'Failed to handle bookmark' }, 500);
  }
});

// Get user's bookmarks
bookmarkRouter.get('/', authMiddleware, async (c) => {
  const userId = c.get('authorId');
  const prisma = createPrismaClient(c.env.DATABASE_URL);

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        blog: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const blogs = bookmarks.map(bookmark => ({
      ...bookmark.blog,
      bookmarked: true
    }));

    return c.json({ success: true, data: blogs });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return c.json({ success: false, error: 'Failed to fetch bookmarks' }, 500);
  }
});

// Check if a blog is bookmarked
bookmarkRouter.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const userId = c.get('authorId');
  const prisma = createPrismaClient(c.env.DATABASE_URL);

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId: parseInt(id)
        }
      }
    });

    return c.json({ success: true, data: { bookmarked: !!bookmark } });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return c.json({ success: false, error: 'Failed to check bookmark status' }, 500);
  }
}); 