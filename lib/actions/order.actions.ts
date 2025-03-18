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
import { PAGE_SIZE } from "../constants";
import { Prisma } from "@prisma/client";

// Update CDO order to delivered

export async function deliverOrder(orderId: string) {
    try {
        const order = await prisma.order.findFirst({ where: { id: orderId}});

        if(!order) {
            throw new Error('Order not found');
        }
        
        if(!order.isPaid) {
            throw new Error('Order is not paid');
        }

        await prisma.order.update({ where : { id: orderId}, data: { isDelivered: true, deliveredAt: new Date()}});
        revalidatePath(`/order/${orderId}`);

        return {
            success: true,
            message: "Order has been marked as delivered"
        }

    }catch(error: unknown) {
        return {
            success: false,
            message: formatError(error)
        }
    }
}

// Update order to paid by COD
export async function updateOrderToPaidCOD(orderId: string) {
    try {
        await updateOrderToPaid({orderId});
        revalidatePath(`/order/${orderId}`)

        return {
            success: true,
            message: "Order marked as paid"
        }

    }catch(error: unknown) {
        return {
            success: false,
            message: formatError(error)
        }
    }
}


// Delete order
export async function deleteOrder(id: string ){
    try {
        await prisma.order.delete({
            where: {
                id
            }
        }) 

        revalidatePath('/admin/orders');

        return {
            success: true,
            message: "Order deleted successfully"
        }


    } catch(error: unknown) {
        return {
            success: false,
            message: formatError(error)
        }
    }
}

// Get All orders
export async function getAllOrders({ limit = PAGE_SIZE, page, query } : { limit?: number, page?: number | null, query: string }) {
    const queryFilter: Prisma.OrderWhereInput = query && query !== 'all' ? {
        user: {
            name:  {
                contains: query,
                mode: 'insensitive'
            } as Prisma.StringFilter
        }
    }: {};
    const data = await prisma.order.findMany({
        where: {
            ...queryFilter
        },
        orderBy: {
            createdAt: 'desc'
        },
        take:limit,
        skip: page ? (page - 1) * limit : 0,
        include: {
            user: {
                select: {
                    name: true
                }
            }
        }
    });

    const dataCount = await prisma.order.count();

    return {
        data,
        totalPages: Math.ceil(dataCount / limit)
    }
}

// Get Sales Data and Order summary
type SalesDataType = {
     month: string;
     totalSales: number
}[];

export async function getOrderSummary() {
    // Get counts for each resources 

    const ordersCount = await prisma.order.count();
    const productsCount = await prisma.product.count();
    const usersCount = await prisma.user.count();


    // Calculate total sales

    const totalSales = await prisma.order.aggregate({
        _sum: {
            totalPrice: true
        }
    });

    // Get Monthly sales
    const salesDataRaw = await prisma.$queryRaw<
        Array<{month: string; totalSales: Prisma.Decimal}>
        >` 
        SELECT to_char("createdAt", 'MM/YY') as "month",
               sum("totalPrice") as "totalSales"
        FROM "Order"
        GROUP BY to_char("createdAt", 'MM/YY')`;

    const salesData: SalesDataType = salesDataRaw.map((entry)=> ({
        month: entry.month,
        totalSales: Number(entry.totalSales)
    }))


    // Get latest orders

    const latestSales = await prisma.order.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            user: {
                select : {
                    name: true 
                }
            }
        },
        take: 6
    });


    return {
        ordersCount,
        productsCount,
        usersCount,
        totalSales,
        latestSales,
        salesData
    }

}

// Get the users orders
export async function getMyOrders({limit = PAGE_SIZE, page}: { limit?: number, page: number}) {
    const session = await auth();
    if(!session) {
        throw new Error("User not authorized");
    }

    const data = await prisma.order.findMany({
        where: {
            userId: session?.user?.id
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: limit,
        skip: (page-1) * limit
    })

    const dataCount = await prisma.order.count({
        where: {
            userId: session?.user?.id
        }
    })

    return {
        data,
        totalPages: Math.ceil(dataCount / limit) 
    }
}

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