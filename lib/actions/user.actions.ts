"use server";
import { signInFormSchema, SignUpFormData, signUpFormSchema } from "../validators";
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/db/prisma";
import { formatError } from "../utils";

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
        console.log(error.name)
        console.log(error.code)
        console.log(error.errors)
        console.log(error.meta?.target)

        if(isRedirectError(error)) {
            throw error;
        }

        return { success: false, message: formatError(error), inputs: rawData}
    }

}