"use server";

import { z } from "zod";
import { insertReviewSchema } from "../validators";
import { formatError } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";

// Get a review written by current user
export async function getReviewByProductId({productId}: {productId: string}) {
    const session = await auth();
    if(!session) throw new Error("Unauthenticated user");

    return await prisma.review.findFirst({
        where: {
            productId: productId,
            userId: session?.user?.id 
        }
    })

}

// Get All reviews for a product
export async function getReviews({productId}: {productId: string}) {
    const data = await prisma.review.findMany({
        where: { productId: productId},
        include: { user: { select: { name: true}}},
        orderBy: { createdAt: 'desc'}
    })

    return { 
        data
    }
}

// Create & Update Reviews
export async function createUpdateAndReview(data: z.infer<typeof insertReviewSchema>) {

    try {
        const session = await auth();

        if(!session) throw new Error('User not authenticated');

        // Validate and store review
        const review = insertReviewSchema.parse({
            ...data,
            userId: session?.user?.id
        });

        // Get Product that is being  reviewed
        const product  = await prisma.product.findFirst({
            where: {
                id: review.productId
            }
        })

        if(!product) throw new Error("Product not found");

        // Check user already reviwed
        const reviwExists = await prisma.review.findFirst({
            where: {
                productId: review.productId,
                userId: review.userId
            }
        })

        await prisma.$transaction( async (tx) => {
            if(reviwExists) {
                // Update Review
                await tx.review.update({
                    where: { id: reviwExists.id},
                    data: {
                        title: review.title,
                        description: review.description,
                        rating: review.rating
                    } 
                })
            }
            else {
                // Create Review
                await tx.review.create({
                    data: review
                })
            }

            // Get the avarage rating
            const avarageRating = await tx.review.aggregate({
                _avg: {
                    rating: true
                },
                where: {
                    productId: review.productId
                }
            });

            // Get number of reviews
            const numReviews = await tx.review.count({
                where : { productId: review.productId}
            })
            

            // Update the rating and numReviews in product table
            await tx.product.update({
                where: { id: review.productId},
                data: { rating: avarageRating._avg.rating || 0, numReviews }
            })
        })

        revalidatePath(`/product/${product.slug}`);

        return {
            success: true,
            message: "Review Updated Successfully"
        }


    } catch(error: unknown) {
        return { success: false, message: formatError(error)}
    }


}