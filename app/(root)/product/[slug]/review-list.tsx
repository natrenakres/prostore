"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ReviewForm } from "./review-form";
import { getReviews } from "@/lib/actions/review.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Rating } from "@/components/shared/product/rating";
import { Review } from "@/types";


export function ReviewList({ userId, productId, slug } : { userId: string, productId: string, slug: string}) {
    const [reviews, setReviews] = useState<Review[]>([]);


    useEffect(()=> {
        const loadReviews = async () => {
            const res = await getReviews({ productId});
            setReviews(res.data);
        }
        loadReviews();
    }, [productId]);

    // Reload Reviews after created or updated
    const reload = async () => {
        const res = await getReviews({productId});
        setReviews([...res.data]);
    }

    return (
        <div className="space-y-4"> 
            { reviews.length === 0 && <p>No reviews yet</p>  }
            {
                userId ? (
                    <ReviewForm userId={userId} productId={productId} onReviewSubmitted={reload} />
                ) : (
                    <div className="">
                        Please <Link className="text-blue-700 px-2" href={`/sign-in?callbackUrl=/product/${slug}`}>sign In</Link> to write a review
                    </div>
                )
            }
            <div className="flex flex-col gap-3">                
                {
                    reviews.map((review)=> (
                        <Card key={review.id}>
                            <CardHeader>
                                <div className="flex-between">
                                    <CardTitle>{review.title}</CardTitle>
                                    <CardDescription>{review.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex space-x-4 text-sm text-muted-foreground">
                                    <Rating value={review.rating} />
                                    <div className="flex items-center">
                                        <User className="mr-1 h-3 w-3" /> 
                                        {
                                            review.user ? review.user.name : 'DELETED USER'
                                        }
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {
                                            formatDateTime(review.createdAt).dateTime
                                        }
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                }
            </div>
        </div>
    )
}