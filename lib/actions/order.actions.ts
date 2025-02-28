"use server"

import { isRedirectError } from "next/dist/client/components/redirect-error"
import { convertToPlainObject, formatError } from "../utils";
import { auth } from "@/auth";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertOrderSchema} from "../validators";
import { prisma } from "@/db/prisma";
import { CartItem, PaymentResult } from "@/types";
import { paypal } from "../paypal";
import { revalidatePath } from "next/cache";

// Approve paypal order and update the order to paid
export async function approvePayPalOrder(orderId: string, data: {orderID: string}) {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId 
            }
         }); 
         if(!order) {
            throw new Error('Order not found');
         }

         const capturedPayment = await paypal.capturePayment(data.orderID); 

         if(!capturedPayment || capturedPayment.id !== (order.paymentResult as PaymentResult)?.id || capturedPayment.status !== "COMPLETED" ) {
            throw new Error('Error in paypal payment');
         }

         // Update the order to paid
         await updateOrderToPaid({
            orderId, 
            paymentResult: {
                id: capturedPayment.id,
                status: capturedPayment.status,
                email_address: capturedPayment.payer.email_address,
                pricePaid: capturedPayment.purchase_units[0]?.payments?.captures[0]?.amount?.value
            }
        });

         revalidatePath(`/order/${orderId}`);
         return {
            success: true,
            message: 'Your order has been paid'
         }


    } catch(error: unknown) {
        return { 
            success: false,
            message: formatError(error)
        }
    }
}
 


export async function createPayPalOrder(orderId: string) {

    try {
         // Get order from database
         const order = await prisma.order.findFirst({
            where: {
                id: orderId 
            }
         });

         if(order) {
            // Create paypal order
            const paypalOrder = await paypal.createOrder(Number(order.totalPrice)); 
            // Update Order with paypal order id
            await prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    paymentResult: {
                        id: paypalOrder.id,
                        email_address: '',
                        status: '',
                        pricePaid: 0
                    }
                }
            });

            return {
                success: true,
                message: 'Item order created successfully',
                data: paypalOrder.id
            }
         } else {
            throw new Error('Order not found');
         }


    } catch(error: unknown) {
        return {
            success: false,
            message: formatError(error)
        }
    }


}

// Create order and create the order items
export async function createOrder() {
    try {
        const session = await auth();
        if(!session) throw new Error('User is not authenticated');

        const cart = await getMyCart();
        const userId = session?.user?.id;
        if(!userId) throw new Error('User not found');

        const user = await getUserById(userId);

        if(!cart || cart.items.length === 0) {
            return {
                success: false,
                message: 'Your cart is emtpy',
                redirectTo: '/cart'
            }
        }
        if(!user.address) {
            return {
                success: false,
                message: 'No shipping address',
                redirectTo: '/shipping-address'
            }
        }
        if(!user.paymentMethod) {
            return {
                success: false,
                message: 'No Payment method',
                redirectTo: '/payment-method'
            }
        }

        // Create order object
        const order = insertOrderSchema.parse({
            userId: user.id,
            shippingAddress: user.address,
            paymentMethod: user.paymentMethod,
            itemsPrice: cart.itemsPrice,
            shippingPrice: cart.shippingPrice,
            taxPrice: cart.taxPrice,
            totalPrice: cart.totalPrice,
        });


        // Create a transaction to create order and order items in database

        const insertedOrderId = await prisma.$transaction(async (tx) => {
            // Create order 
            const insertedOrder = await tx.order.create({
                data: order
            });

            // Create order items from the cart items
            for(const item of cart.items as CartItem[]) {
                await tx.orderItem.create({
                    data: {
                        ...item,
                        price: item.price,
                        orderId: insertedOrder.id
                    }
                });                
            }

            // Clear cart
            await tx.cart.update({
                where: { id: cart.id},
                data: {
                    items: [],
                    totalPrice: 0,
                    taxPrice: 0,
                    shippingPrice: 0,
                    itemsPrice: 0
                }
            });

            return insertedOrder.id;
        });



        if(!insertedOrderId) throw new Error('Order not created');

        return {
            success: true,
            message: 'Order Created',
            redirectTo: `/order/${insertedOrderId}`
        }


    } catch(error: unknown) {
        if(isRedirectError(error)) throw error
        console.error(error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

// Get Order by id
export async function getOrderById(orderId: string) {
    const data = await prisma.order.findFirst({
        where: {
            id: orderId
        },
        include: {
            orderitems: true,
            user: {
                select: { name: true, email: true }
            }
        }
    });   

    return convertToPlainObject(data);
}

export async function updateOrderToPaid({orderId, paymentResult}: {orderId: string, paymentResult?: PaymentResult}) {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId 
        },
        include: {
            orderitems: true 
        }
     }); 
     if(!order) {
        throw new Error('Order not found');
     }

     if(order.isPaid) {
        throw new Error('Order is already paid');
     }

     // Transaction
     await prisma.$transaction(async (tx) => {
        for(const item of order.orderitems) {
            await tx.product.update({
                where: {
                    id: item.productId
                },
                data : {
                    stock: {
                        increment: -item.qty
                    }
                }
            });
        }

        await tx.order.update({
            where: { id: order.id},
            data: {
                isPaid: true,
                paidAt: new Date(),
                paymentResult
            }
        })
     })

     // Get updated order after transaction
     const updatedOrder = await prisma.order.findFirst(
        {
            where: {
                id: orderId 
            },
            include: {
                orderitems: true,
                user: {
                    select: { name: true, email: true}
                }
            }
        }
     );

     if(!updatedOrder) {
        throw new Error('Order is not updated');
     }

}