import { Pagination } from "@/components/shared/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMyOrders } from "@/lib/actions/order.actions";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import { Metadata } from "next"
import Link from "next/link"

export const matadata: Metadata = {
    title: 'User Orders'
}

export default async function OrdersPage({ searcParams}: { searcParams: Promise<{page: string}>}) {
    const params = await searcParams;    

    const orders = await getMyOrders({
        page: Number(params?.page) || 1
    } );


    return (
        <div className="space-y-2">
            <h2 className="h2-bold">
                Orders
            </h2>
            <div className="overflow-x-auto"> 
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>DATE</TableHead>
                            <TableHead>TOTAL</TableHead>
                            <TableHead>PAID</TableHead>
                            <TableHead>DELIVERED</TableHead>
                            <TableHead>ACTIONS </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            orders?.data?.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>{formatId(order.id)}</TableCell>
                                    <TableCell>{formatDateTime(order.createdAt).dateTime}</TableCell>
                                    <TableCell>{formatCurrency(order?.totalPrice)}</TableCell>
                                    <TableCell>{order.isPaid && order.paidAt ? formatDateTime(order.paidAt).dateTime : 'Not Paid '}</TableCell>
                                    <TableCell>{order.isDelivered && order.deliveredAt ? formatDateTime(order.deliveredAt).dateTime : 'Not Delivered'}</TableCell>
                                    <TableCell>
                                    <Link href={`/orders/${order.id}`}>
                                        <span className="px-2">Details</span>
                                    </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
                {
                    orders.totalPages > 1 && <Pagination page={Number(params?.page) || 1} totalPages={orders.totalPages} />
                }
            </div>
        </div>
    )
}