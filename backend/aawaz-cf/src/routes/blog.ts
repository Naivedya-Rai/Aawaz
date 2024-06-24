import { Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { CreateBlogInput, createBlogInput, updateBlogInput } from "@naivedya/aawaz-common"

export const blogRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
    },
    Variables: {
        userId: string;
    }
  }>

//Middleware to check authentication
blogRouter.use('/*', async(c, next) => {
    //can add a default empty string incase its empty
    const authHeader = c.req.header("authorization") || "";
    try{
        const user = await verify(authHeader, c.env.JWT_SECRET)
        if(user){
            //@ts-ignore
            c.set("userId", user.id);
            await next()
        } else {
            c.status(403)
            return c.json({
                message: "You are not logged in"
            })
        }
    } catch(e){
        c.status(403)
            return c.json({
                message: "Not logged in"
            })
    }
    
})

blogRouter.post('/', async(c) => {
    //create new blog - initialise prisma 
    const body = await c.req.json();
    const {success} = createBlogInput.safeParse(body);
    if (!success){
        c.status(411);
        return c.json({
            message: "Incorrect inputs"
        })
    }

    const authorId = c.get("userId");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.create({
        data: {
            title: body.title,
            content: body.content,
            //this will be extracted by the middleware
            authorId: Number(authorId)
        }
    })

    return c.json({
        id: blog.id
    })
})

blogRouter.put('/', async(c) => {
    const body = await c.req.json();

    const {success} = updateBlogInput.safeParse(body);
    if (!success){
        c.status(411);
        return c.json({
            message: "Incorrect inputs"
        })
    }
  
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.update({
        where: {
            id: body.id
        },
        data: {
            title: body.title,
            content: body.content,
        }
    })

    return c.json({
        id: blog.id
    })
})

//Implement Pagination
blogRouter.get('/bulk', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
  
      try {
          const blogs = await prisma.blog.findMany({
            select: {
                content: true,
                title: true,
                id: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
          });
      
          return c.json({
              blogs
          })

      } catch(e){
          c.status(411); //need better code
          return c.json({
              message: "Error while fetching all blogs"
          })
      }
})
blogRouter.get('/:id', async(c) => {
    const id = c.req.param("id");
  
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: Number(id)
            },
            select: {
                title: true,
                content: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
        })
    
        return c.json({
            blog
        })
    } catch(e){
        c.status(411); //need better code
        return c.json({
            message: "Error while fetching blog post"
        })
    }
})
