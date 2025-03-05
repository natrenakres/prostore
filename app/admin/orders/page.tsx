import { DeleteDialog } from "@/components/shared/delete-dialog";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { deleteOrder, getAllOrders } from "@/lib/actions/order.actions"
import { requiredAdmin } from "@/lib/auth-guard";
import { formatId, formatDateTime, formatCurrency } from "@/lib/utils";

import { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
    title: 'Admin Orders'
}


export default async function OrdersPage(props: { searcParams: Promise<{page: string}>}) {
    const params    =  await props.searcParams;

    await requiredAdmin();

    const {data, totalPages} = await getAllOrders({
        page: Number(params?.page),
    });

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
                            data?.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>{formatId(order.id)}</TableCell>
                                    <TableCell>{formatDateTime(order.createdAt).dateTime}</TableCell>
                                    <TableCell>{formatCurrency(order?.totalPrice)}</TableCell>
                                    <TableCell>{order.isPaid && order.paidAt ? formatDateTime(order.paidAt).dateTime : 'Not Paid '}</TableCell>
                                    <TableCell>{order.isDelivered && order.deliveredAt ? formatDateTime(order.deliveredAt).dateTime : 'Not Delivered'}</TableCell>
                                    <TableCell>
                                        <Button variant={'outline'} size={"sm"} asChild>
                                            <Link href={`/order/${order.id}`}>
                                                Details
                                            </Link>
                                        </Button>
                                        <DeleteDialog id={order.id} action={deleteOrder} />
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
                {
                    totalPages > 1 && <Pagination page={Number(params?.page) || 1} totalPages={totalPages} />
                }
            </div>
        </div>
    )
}