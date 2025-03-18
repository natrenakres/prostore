import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/actions/order.actions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);


export default async  function StripePaymentSuccessPage(props: { params: Promise<{id: string}>, searchParams: Promise<{payment_intent: string}> }){
    const { id } = await props.params;
    const { payment_intent: paymentIntentId  } = await props.searchParams;

    // Fetch order
    const order = await getOrderById(id);
    if(!order) notFound();
    // Retrieve Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    // Check if Payment Intent is valid
    if(paymentIntent.metadata.orderId === null || paymentIntent.metadata.orderId !== order.id.toString()) {
        return notFound();
    }

    // Check if payment successfull
    const isSuccess = paymentIntent.status === 'succeeded';

    if(!isSuccess) return redirect(`/order/${id}`);


    return (
        <div className="max-w-4xl w-full mx-auto space-y-8">
            <div className="flex flex-col items-center">
                <h1 className="h1-bold">Thanks for purches</h1>
                <p>We are processing order.</p>
                <Button asChild>    
                    <Link href={`/order/${id}`}>View Order</Link>
                </Button>
            </div>
        </div>
    )

}