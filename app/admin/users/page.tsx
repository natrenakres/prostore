import { DeleteDialog } from "@/components/shared/delete-dialog";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteUser, getAllUsers } from "@/lib/actions/user.actions"
import { formatId } from "@/lib/utils";
import Link from "next/link";
import { Metadata } from "next"
import { Badge } from "@/components/ui/badge";


export const metadata: Metadata = {
    title: 'Admin Users'
}

export default async function AdminUserPage(props: { searchParams: Promise<{ page: string, query: string }>}) {
    const { page, query: searchText } = await props.searchParams;    
    const { data, totalPages} = await getAllUsers({ page: Number(page ?? 1), query: searchText });    

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                    <h1 className="h2-bold">Users</h1>
                    { searchText && (
                        <div>
                            Filtered by <i>&quot;{searchText}&quot;</i> {' '}
                            <Link href="/admin/users">
                                <Button variant="outline" size="sm">Remove Filter</Button>
                            </Link>
                        </div>
                     )
                    }

                </div>
            <div className="overflow-x-auto"> 
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>NAME</TableHead>
                            <TableHead>EMAIL</TableHead>
                            <TableHead>ROLE</TableHead>                            
                            <TableHead>ACTIONS </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            data?.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>{formatId(user.id)}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {
                                            user.role === 'user' 
                                            ? <Badge variant="secondary">User</Badge>
                                            : <Badge>Admin</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Button variant={'outline'} size={"sm"} asChild>
                                            <Link href={`/admin/users/${user.id}`}>
                                                Edit
                                            </Link>
                                        </Button>
                                         <DeleteDialog id={user.id} action={deleteUser} /> 
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
                {
                    totalPages && totalPages > 1 && <Pagination page={Number(page) || 1} totalPages={totalPages} />
                }
            </div>
        </div>
    )
}