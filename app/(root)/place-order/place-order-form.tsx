"use client";
import { useFormStatus } from "react-dom";
import { createOrder } from "@/lib/actions/order.actions";
import { Check, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { useRouter } from "next/navigation";


export function PlaceOrderForm(){

    const router = useRouter();

    function PlaceOrderButton() {
        const { pending} = useFormStatus();
        return (
            <Button disabled={pending} className="w-full">
                {
                    pending ? (
                        <Loader className="w-3 h-4 animate-spin" />
                    )
                    : (
                        <Check className="w-4 h-4" /> 
                    )
                    
                }
                {' '}Place Order
            </Button>
        )
    }

    async function handleSubmit(event: React.FormEvent){
        event.preventDefault();       

        const res = await createOrder();
        if(res.redirectTo){
            router.push(res.redirectTo);
        }
    }

    return <form className="w-full" onSubmit={handleSubmit} >
        <PlaceOrderButton />
       </form>
}