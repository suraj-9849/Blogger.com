import { Hono } from "hono";
import { createPrismaClient } from '../config/prisma';
import { createBlogSchema, updateBlogSchema } from "@suraj-9849/common";
import { verify } from "hono/jwt";
import { authMiddleware } from '../middleware/auth';

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    authorId: number;
    limit: number;
    page: number;
  };
}>();

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.split(" ")[1];

  if (token) {
    try {
      const user = await verify(token, c.env.JWT_SECRET);
      if (user && user.id) {
        c.set("authorId", user.id as number);
      }
    } catch (e) {
      console.error("Error verifying token:", e);
    }
  }
  await next();
};

const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Utility function to calculate read time
const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Utility function to get excerpt
const getExcerpt = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + '...';
};

// Create Blog Post
blogRouter.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { success } = createBlogSchema.safeParse(body);

    if (!success) {
      return c.json({
        success: false,
        error: "Invalid input data"
      }, 400);
    }

    const authorId = c.get("authorId");

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    const slug = createSlug(body.title);
    const readTime = calculateReadTime(body.content);
    const excerpt = getExcerpt(body.content);

    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        thumbnail: body.thumbnail,
        authorId: authorId,
        published: body.published || false,
        slug,
        readTime,
        excerpt
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Handle tags if provided
    if (body.tags && body.tags.length > 0) {
      for (const tagName of body.tags) {
        // Find or create tag
        let tag = await prisma.tag.findUnique({
          where: { name: tagName.toLowerCase() }
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName.toLowerCase(),
              slug: tagName.toLowerCase().replace(/\s+/g, '-')
            }
          });
        }

        // Create blog-tag relationship
        await prisma.blogTag.create({
          data: {
            blogId: blog.id,
            tagId: tag.id
          }
        });
      }

      // Refetch blog with tags
      const blogWithTags = await prisma.blog.findUnique({
        where: { id: blog.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      return c.json({
        success: true,
        data: blogWithTags,
        message: "Blog created successfully"
      }, 201);
    }

    return c.json({
      success: true,
      data: blog,
      message: "Blog created successfully"
    }, 201);

  } catch (error: any) {
    console.error("Error creating blog:", error);
    return c.json({
      success: false,
      error: "Failed to create blog"
    }, 500);
  }
});

// Update Blog Post
blogRouter.put("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { success } = updateBlogSchema.safeParse(body);

    if (!success) {
      return c.json({
        success: false,
        error: "Invalid input data"
      }, 400);
    }

    const authorId = c.get("authorId");

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if blog exists and user owns it
    const existingBlog = await prisma.blog.findUnique({
      where: { id: body.id }
    });

    if (!existingBlog) {
      return c.json({
        success: false,
        error: "Blog not found"
      }, 404);
    }

    if (existingBlog.authorId !== authorId) {
      return c.json({
        success: false,
        error: "Unauthorized to update this blog"
      }, 403);
    }

    const updateData: any = {};
    if (body.title) updateData.title = body.title;
    if (body.content) updateData.content = body.content;
    if (body.thumbnail) updateData.thumbnail = body.thumbnail;
    if (typeof body.published === 'boolean') updateData.published = body.published;

    const blog = await prisma.blog.update({
      where: { id: body.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Handle tags if provided
    if (body.tags !== undefined) {
      // Remove existing blog-tag relationships
      await prisma.blogTag.deleteMany({
        where: { blogId: body.id }
      });

      // Add new tags if provided
      if (body.tags && body.tags.length > 0) {
        for (const tagName of body.tags) {
          // Find or create tag
          let tag = await prisma.tag.findUnique({
            where: { name: tagName.toLowerCase() }
          });

          if (!tag) {
            tag = await prisma.tag.create({
              data: {
                name: tagName.toLowerCase(),
                slug: tagName.toLowerCase().replace(/\s+/g, '-')
              }
            });
          }

          // Create blog-tag relationship
          await prisma.blogTag.create({
            data: {
              blogId: body.id,
              tagId: tag.id
            }
          });
        }
      }

      // Refetch blog with tags after updating them
      const blogWithTags = await prisma.blog.findUnique({
        where: { id: body.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      return c.json({
        success: true,
        data: blogWithTags,
        message: "Blog updated successfully"
      });
    }

    return c.json({
      success: true,
      data: blog,
      message: "Blog updated successfully"
    });

  } catch (error: any) {
    console.error("Error updating blog:", error);
    return c.json({
      success: false,
      error: "Failed to update blog"
    }, 500);
  }
});

// Get All Blogs with Filtering and Pagination
blogRouter.get("/", optionalAuthMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || '1');
    const limit = Math.min(parseInt(c.req.query("limit") || '10'), 50);
    const search = c.req.query("search");
    const author = c.req.query("author");
    const sortBy = c.req.query("sortBy") || 'latest';
    const published = c.req.query("published") !== 'false';

    const skip = (page - 1) * limit;

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Build where clause
    const whereClause: any = { published };

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ];
    }

    if (author) {
      whereClause.author = {
        username: { contains: author }
      };
    }

    // Build order by clause
    let orderBy: any = { id: 'desc' }; // default
    switch (sortBy) {
      case 'latest':
        orderBy = { id: 'desc' };
        break;
      case 'oldest':
        orderBy = { id: 'asc' };
        break;
      case 'popular':
        // For now, order by id desc, later we can use view counts
        orderBy = { id: 'desc' };
        break;
      case 'trending':
        // For now, order by id desc, later we can implement trending algorithm
        orderBy = { id: 'desc' };
        break;
    }

    const [blogs, totalBlogs] = await Promise.all([
      prisma.blog.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.blog.count({ where: whereClause })
    ]);

    return c.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total: totalBlogs,
        pages: Math.ceil(totalBlogs / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching blogs:", error);
    return c.json({
      success: false,
      error: "Failed to fetch blogs"
    }, 500);
  }
});

// Get Trending Blogs
blogRouter.get("/trending", async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query("limit") || '10'), 20);

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // For now, get most recent published blogs
    // Later we can implement proper trending algorithm based on views, likes, etc.
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      },
      take: limit,
      orderBy: { id: 'desc' }
    });

    // Get real trending stats
    const [totalViews, totalLikes, totalComments] = await Promise.all([
      prisma.view.count({ where: { blog: { published: true } } }),
      prisma.like.count({ where: { blog: { published: true } } }),
      prisma.comment.count({ where: { blog: { published: true } } })
    ]);

    const trendingStats = {
      totalViews,
      totalLikes,
      totalComments,
      newBlogs: blogs.length,
      topAuthors: blogs.slice(0, 5).map((blog: { author: any; }) => blog.author)
    };

    return c.json({
      success: true,
    data: {
        blogs,
        stats: trendingStats
      }
    });

  } catch (error: any) {
    console.error("Error fetching trending blogs:", error);
    return c.json({
      success: false,
      error: "Failed to fetch trending blogs"
    }, 500);
  }
});

// Get Single Blog by ID
blogRouter.get("/:id", optionalAuthMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!blog) {
      return c.json({
        success: false,
        error: "Blog not found"
      }, 404);
    }

    // TODO: Track view (when we have the view model)
    // const userId = c.get("authorId");
    // if (userId) {
    //   await trackView(prisma, blog.id, userId);
    // }

    return c.json({
      success: true,
      data: blog
    });

  } catch (error: any) {
    console.error("Error fetching blog:", error);
    return c.json({
      success: false,
      error: "Failed to fetch blog"
    }, 500);
  }
});

// Delete Blog
blogRouter.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const authorId = c.get("authorId");

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if blog exists and user owns it
    const existingBlog = await prisma.blog.findUnique({
      where: { id }
    });

    if (!existingBlog) {
      return c.json({
        success: false,
        error: "Blog not found"
      }, 404);
    }

    if (existingBlog.authorId !== authorId) {
      return c.json({
        success: false,
        error: "Unauthorized to delete this blog"
      }, 403);
    }

    await prisma.blog.delete({
      where: { id }
  });

  return c.json({
      success: true,
      message: "Blog deleted successfully"
    });

  } catch (error: any) {
    console.error("Error deleting blog:", error);
    return c.json({
      success: false,
      error: "Failed to delete blog"
    }, 500);
  }
});

// Get User's Own Blogs (including unpublished)
blogRouter.get("/my/blogs", authMiddleware, async (c) => {
  try {
    const authorId = c.get("authorId");

    const page = parseInt(c.req.query("page") || '1');
    const limit = Math.min(parseInt(c.req.query("limit") || '10'), 50);
    const skip = (page - 1) * limit;

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    const [blogs, totalBlogs] = await Promise.all([
      prisma.blog.findMany({
        where: { authorId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { id: 'desc' }
      }),
      prisma.blog.count({ where: { authorId } })
    ]);

    return c.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total: totalBlogs,
        pages: Math.ceil(totalBlogs / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching user blogs:", error);
    return c.json({
      success: false,
      error: "Failed to fetch user blogs"
    }, 500);
  }
});

// Search Blogs
blogRouter.get("/search/:query", async (c) => {
  try {
    const query = c.req.param("query");

    const page = parseInt(c.req.query("page") || '1');
    const limit = Math.min(parseInt(c.req.query("limit") || '10'), 50);
  const skip = (page - 1) * limit;

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    const whereClause = {
      published: true,
      OR: [
        { title: { contains: query } },
        { content: { contains: query } }
      ]
    };

    const [blogs, totalBlogs] = await Promise.all([
      prisma.blog.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        },
    skip,
    take: limit,
        orderBy: { id: 'desc' }
      }),
      prisma.blog.count({ where: whereClause })
    ]);

    return c.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total: totalBlogs,
        pages: Math.ceil(totalBlogs / limit)
      }
    });

  } catch (error: any) {
    console.error("Error searching blogs:", error);
    return c.json({
      success: false,
      error: "Failed to search blogs"
    }, 500);
  }
});

// Get Blog Analytics (for blog owners)
blogRouter.get("/analytics/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const authorId = c.get("authorId");

    // Create Prisma client with environment variable
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if blog exists and user owns it
    const blog = await prisma.blog.findUnique({
      where: { id }
    });

    if (!blog) {
      return c.json({
        success: false,
        error: "Blog not found"
      }, 404);
    }

    if (blog.authorId !== authorId) {
      return c.json({
        success: false,
        error: "Unauthorized to view analytics for this blog"
      }, 403);
    }

    // Get real analytics
    const [likes, comments, views] = await Promise.all([
      prisma.like.count({ where: { blogId: id } }),
      prisma.comment.count({ where: { blogId: id } }),
      prisma.view.count({ where: { blogId: id } })
    ]);

    const analytics = {
      views: blog.viewCount,
      likes: blog.likeCount,
      comments: blog.commentCount,
      shares: 0, // Not implemented yet
      readTime: blog.readTime || 5,
      publishedDate: blog.publishedAt,
      lastModified: blog.updatedAt
    };

    return c.json({
      success: true,
      data: {
        blog: {
          id: blog.id,
          title: blog.title,
          published: blog.published
        },
        analytics
      }
    });

  } catch (error: any) {
    console.error("Error fetching blog analytics:", error);
    return c.json({
      success: false,
      error: "Failed to fetch blog analytics"
    }, 500);
  }
});

// Like/Unlike Blog
blogRouter.post("/:id/like", authMiddleware, async (c) => {
  try {
    const blogId = parseInt(c.req.param("id"));
    const userId = c.get("authorId");

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      return c.json({
        success: false,
        error: "Blog not found"
      }, 404);
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          userId_blogId: {
            userId,
            blogId
          }
        }
      });

      // Update blog like count
      await prisma.blog.update({
        where: { id: blogId },
        data: {
          likeCount: {
            decrement: 1
          }
        }
      });

      return c.json({
        success: true,
        data: { liked: false },
        message: "Blog unliked successfully"
      });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          blogId
        }
      });

      // Update blog like count
      await prisma.blog.update({
        where: { id: blogId },
        data: {
          likeCount: {
            increment: 1
          }
        }
      });

      return c.json({
        success: true,
        data: { liked: true },
        message: "Blog liked successfully"
      });
    }

  } catch (error: any) {
    console.error("Error toggling like:", error);
    return c.json({
      success: false,
      error: "Failed to toggle like"
    }, 500);
  }
});

// Bookmark/Unbookmark Blog
blogRouter.post("/:id/bookmark", authMiddleware, async (c) => {
  try {
    const blogId = parseInt(c.req.param("id"));
    const userId = c.get("authorId");

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      return c.json({
        success: false,
        error: "Blog not found"
      }, 404);
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId
        }
      }
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          userId_blogId: {
            userId,
            blogId
          }
        }
      });

      // Update blog bookmark count
      await prisma.blog.update({
        where: { id: blogId },
        data: {
          bookmarkCount: {
            decrement: 1
          }
        }
      });

      return c.json({
        success: true,
        data: { bookmarked: false },
        message: "Blog unbookmarked successfully"
      });
    } else {
      // Add bookmark
      await prisma.bookmark.create({
        data: {
          userId,
          blogId
        }
      });

      // Update blog bookmark count
      await prisma.blog.update({
        where: { id: blogId },
        data: {
          bookmarkCount: {
            increment: 1
          }
        }
      });

      return c.json({
        success: true,
        data: { bookmarked: true },
        message: "Blog bookmarked successfully"
      });
    }

  } catch (error: any) {
    console.error("Error toggling bookmark:", error);
    return c.json({
      success: false,
      error: "Failed to toggle bookmark"
    }, 500);
  }
});

// Record Blog View
blogRouter.post("/:id/view", optionalAuthMiddleware, async (c) => {
  try {
    const blogId = parseInt(c.req.param("id"));
    const userId = c.get("authorId") || null;
    const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    const userAgent = c.req.header("user-agent") || "unknown";

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      return c.json({
        success: false,
        error: "Blog not found"
      }, 404);
    }

    // Check if view already recorded (prevent spam)
    const recentView = await prisma.view.findFirst({
      where: {
        blogId,
        OR: [
          { userId: userId },
          { ipAddress: ipAddress }
        ],
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      }
    });

    if (!recentView) {
      // Record new view
      await prisma.view.create({
        data: {
          blogId,
          userId,
          ipAddress,
          userAgent
        }
      });

      // Update blog view count
      await prisma.blog.update({
        where: { id: blogId },
        data: {
          viewCount: {
            increment: 1
          }
        }
      });
    }

  return c.json({
      success: true,
      message: "View recorded"
    });

  } catch (error: any) {
    console.error("Error recording view:", error);
    return c.json({
      success: false,
      error: "Failed to record view"
    }, 500);
  }
});

// Get Blog Comments
blogRouter.get("/:id/comments", async (c) => {
  try {
    const blogId = parseInt(c.req.param("id"));
    const page = parseInt(c.req.query("page") || '1');
    const limit = Math.min(parseInt(c.req.query("limit") || '10'), 50);
    const skip = (page - 1) * limit;

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Get top-level comments with replies
    const [comments, totalComments] = await Promise.all([
      prisma.comment.findMany({
        where: {
          blogId,
          parentId: null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.comment.count({
    where: {
          blogId,
          parentId: null
        }
      })
    ]);

    return c.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total: totalComments,
        pages: Math.ceil(totalComments / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return c.json({
      success: false,
      error: "Failed to fetch comments"
    }, 500);
  }
});

// Add Comment
blogRouter.post("/:id/comments", authMiddleware, async (c) => {
  try {
    const blogId = parseInt(c.req.param("id"));
    const userId = c.get("authorId");
    const body = await c.req.json();

    if (!body.content || !body.content.trim()) {
      return c.json({
        success: false,
        error: "Comment content is required"
      }, 400);
    }

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      return c.json({
        success: false,
        error: "Blog not found"
      }, 404);
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: body.content.trim(),
        userId,
        blogId,
        parentId: body.parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    // Update blog comment count
    await prisma.blog.update({
      where: { id: blogId },
      data: {
        commentCount: {
          increment: 1
        }
      }
  });

  return c.json({
      success: true,
      data: comment,
      message: "Comment added successfully"
    });

  } catch (error: any) {
    console.error("Error adding comment:", error);
    return c.json({
      success: false,
      error: "Failed to add comment"
    }, 500);
  }
});

// Get user's bookmarks
blogRouter.get('/bookmarks', authMiddleware, async (c) => {
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
blogRouter.get('/bookmark/:id', authMiddleware, async (c) => {
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

// Add bookmark endpoints
blogRouter.post('/bookmark/:id', authMiddleware, async (c) => {
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