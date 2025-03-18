"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createUpdateAndReview, getReviewByProductId } from "@/lib/actions/review.actions";
import { reviewFormsDefaultValues } from "@/lib/constants";
import { insertReviewSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectValue } from "@radix-ui/react-select";
import { StarIcon } from "lucide-react";
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";


export function ReviewForm({userId, productId, onReviewSubmitted} : { userId: string, productId: string, onReviewSubmitted: () => void }) {
    const [open, setOpen] = useState<boolean>(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof insertReviewSchema>>({
        resolver: zodResolver(insertReviewSchema),
        defaultValues: reviewFormsDefaultValues
    });

    // Open form handler
    const handleOpenForm = async () => {
        form.setValue('productId', productId);
        form.setValue('userId', userId); 
        const review = await getReviewByProductId({productId})

        if(review) {
            form.setValue('title', review.title); 
            form.setValue('description', review.description); 
            form.setValue('rating', review.rating);              
        }

        setOpen(true);
    };

    // Submit Form Handler
    const onSubmit: SubmitHandler<z.infer<typeof insertReviewSchema>> = async (values) => {
        const res = await createUpdateAndReview({...values, productId});

        if(!res.success) {
            return toast({
                variant: 'destructive',
                description: res.message
            })
        }

        setOpen(false);
        onReviewSubmitted();
        toast({            
            description: res.message
        })

    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={handleOpenForm} variant="default">
                Write a Review
            </Button>
            <DialogContent className="sm:max-w[425px]">
                <Form {...form}>
                    <form method="POST" onSubmit={form.handleSubmit(onSubmit)}>
                        <DialogHeader>
                            <DialogTitle>Write a Review</DialogTitle>
                            <DialogDescription>Share your toughts with other customers</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <FormField
                                control={form.control} name="title" render={({field}) => <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter Title" {...field} />  
                                    </FormControl>
                                </FormItem>}
                            />
                            <FormField
                                control={form.control} name="description" render={({field}) => <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Enter the description" {...field} />
                                    </FormControl>
                                </FormItem>}
                            />
                            <FormField
                                control={form.control} name="rating" render={({field}) => <FormItem>
                                    <FormLabel>Rating</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value.toString()} > 
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {
                                                Array.from({length: 5}).map((_, index)=>(
                                                    <SelectItem key={index} value={(index+1).toString()}>    
                                                        {index+1} <StarIcon className="inline h-4 w-4" />
                                                    </SelectItem>
                                                ))
                                            }

                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                                {
                                    form.formState.isSubmitting ? "Submitting..." : "Submit"
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}