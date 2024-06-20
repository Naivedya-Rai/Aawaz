import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { signupInput } from "@naivedya/aawaz-common";
import { signinInput } from "@naivedya/aawaz-common";

export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string
    }
  }>


userRouter.post('/signup', async (c) => {

    //Get data using context
    // ADD ZOD VALIDATION - Todo(1)
    const body = await c.req.json();

    //zod
    const {success} = signupInput.safeParse(body);
    if (!success){
        c.status(411);
        return c.json({
            message: "Incorrect inputs"
        })
    }
  
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    //zod, hashed the password - remaining
    //Create user in prisma
    //no need to check if username unique bec prisma alr has that defined so ideally put this in a try catch incase err thrown by prisma
  
    try {
  
      const user = await prisma.user.create({
        data: {
          username: body.username,
          password: body.password,
          name: body.name
        }
      })
  
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_SECRET)
  
  
  
      return c.text(jwt)
  
    } catch (error) {
  
      c.status(411);
      return c.text("Error in Signup Inputs | Invalid")
  
    }
   
  })
  
  userRouter.post('/signin', async(c) => {
    //Get data using context
    // ADD ZOD VALIDATION - Todo(1)
    const body = await c.req.json();
  
    const {success} = signinInput.safeParse(body);
    if (!success){
        c.status(411);
        return c.json({
            message: "Incorrect inputs"
        })
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    //zod, hashed the password - remaining
    //Create user in prisma
    //no need to check if username unique bec prisma alr has that defined so ideally put this in a try catch incase err thrown by prisma
  
    try {
      //this time we need to find one in db
      const user = await prisma.user.findFirst({
        where: {
          username: body.username,
          password: body.password
        }
      })
  
      if(!user){
        //403 is the status code for unauthorized
        c.status(403);
        return c.json({
          message: "Incorrect details"
        });
      }
  
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_SECRET)
  
  
  
      return c.text(jwt)
  
    } catch (error) {
  
      c.status(411);
      return c.text("Error in Signup Inputs | Invalid")
  
    }
  })