"use server";
import { shippingAddressSchema, signInFormSchema, SignUpFormData, signUpFormSchema, paymentMethodSchema } from "../validators";
import { auth, signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/db/prisma";
import { formatError } from "../utils";
import { ShippingAddress } from "@/types";
import { z } from "zod";

// Sign in the user with credentials

export async function signInWithCredentials(prevState: unknown, formData: FormData) {
    try {

        const user = signInFormSchema.parse({
            email: formData.get('email'),
            password: formData.get('password')
        });

        await signIn('credentials', user);

        return {
            success: true,
            message: 'Signed in successfully'
        }

    } catch(error) {
        if(isRedirectError(error)) {
            throw error;
        }

        return { success: false, message: 'Invalid credentials'}
    }
}

// Sign user out
export async function signOutUser() {
    await signOut();
}

export interface SignUpUserResponse {
    success: boolean,
    message: string,
    errors?: {
        [K in keyof SignUpFormData]?: string[]
    }
}

// Sign user Up 
export async function signUpUser(prevState: SignUpUserResponse | null , formData: FormData){
    const rawData: SignUpFormData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        confirmPassword: formData.get('confirmPassword') as string,
    }
    try {
        const validatedData = signUpFormSchema.safeParse(rawData);

        if(!validatedData.success)  {
            return {
                success: false,
                message: 'Please fix the errors in the form',
                errors: validatedData.error.flatten().fieldErrors,
                inputs: rawData
            }
        }

        const { data: user} = validatedData 

        const plainPassword = user.password;
        user.password = hashSync(user.password, 10);

        await prisma.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: user.password,                
            }
        });

        await signIn('credentials', {
            email: user.email,
            password: plainPassword
        });

        return {
            success: true,
            message: 'User registerd successfully'
        }

    } catch(error: unknown) {
        if(isRedirectError(error)) {
            throw error;
        }

        return { success: false, message: formatError(error), inputs: rawData}
    }

}

// Get User By ID

export async function getUserById(userId: string) {
    const user = await prisma.user.findFirst({
        where: { id: userId}
    });

    if(!user)
        throw new Error('User not found');

    return user;
    
}

// Update the user's address

export async function updateUserAddress(data: ShippingAddress) {

    try {
        const session = await auth();

        const currentUser = await prisma.user.findFirst({
            where: { id: session?.user?.id}
        });

        if(!currentUser) {
            throw new Error('User not found');
        }

        const address = shippingAddressSchema.parse(data);

        await prisma.user.update({
            where: { id: currentUser.id},
            data: { address}
        });

        return {
            success: true,
            message: 'User updated successfully'
        }

    }catch(error: unknown) {
        return {
            success: false,
            message: formatError(error)
        }
    }
}

// Update user's payment method 
export async function updateUserPaymentMethod(data: z.infer<typeof paymentMethodSchema>) {

    try {
        const session = await auth();
        const currentUser = await prisma.user.findFirst({
            where: { id: session?.user?.id}
        });

        if(!currentUser) throw new Error('User not found');

        const paymentMethod = paymentMethodSchema.parse(data);

        await prisma.user.update({
            where: { id: currentUser.id },
            data: { paymentMethod: paymentMethod.type}
        });


        return {
            success: true,
            message: 'User updated successfully'
        }

    }catch (error: unknown) {
        return {
            success: false,
            message: formatError(error)
        }
    }
}