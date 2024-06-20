import z from "zod";

//runtime variable 
//signup
export const signupInput = z.object({
    username: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional()

})

//type inference in zod
//if we just want the inferred type then we can use this
//signup type
export type SignupInput = z.infer<typeof signupInput>

//signin
export const signinInput = z.object({
    username: z.string().email(),
    password: z.string().min(6),

})

//signin type
export type SigninInput = z.infer<typeof signinInput>

//create blog input variable
export const createBlogInput = z.object({
    title: z.string(),
    content: z.string(),
})

//create blog type
export type CreateBlogInput = z.infer<typeof createBlogInput>


//update blog input variable
export const updateBlogInput = z.object({
    title: z.string(),
    content: z.string(),
})

//update blog type
export type UpdateBlogInput = z.infer<typeof updateBlogInput>

