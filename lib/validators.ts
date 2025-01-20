import { z } from "zod";    
import { formatNumberWithDecimal } from "./utils";

const currency = z.string().refine((value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))), 'Price must have exactly two decimal places');

// Schema for inserting products 

export const insertProductSchema = z.object({
    name: z.string().min(3, 'Name must be at least '),
    slug: z.string().min(3, 'Slug must be at least '),
    category: z.string().min(3, 'Category must be at least '),
    brand: z.string().min(3, 'Brand must be at least '),
    description: z.string().min(3, 'Description must be at least '),
    stock: z.coerce.number(),
    images: z.array(z.string()).min(1, 'Product must have at least one image'),
    isFeatured: z.boolean(),
    banner: z.string().nullable(), 
    price:  currency
});

// Schema for sign in users in

export const signInFormSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});


// Schema for signing up a user

export const signUpFormSchema = z.object({
    name: z.string().min(3, 'Name must be azleat 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters')
}).refine(({ password, confirmPassword}) => password === confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

export interface SignUpFormData {
    name: string,
    email: string,
    password: string,
    confirmPassword: string
}

