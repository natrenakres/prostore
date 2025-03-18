import NotFound from "@/app/not-found";
import { getUserById } from "@/lib/actions/user.actions";
import { Metadata } from "next"
import { UpdateUserForm } from "./update-user-form";

export const metadata: Metadata = {
    title: 'User Edit'
}

export default async function UserDetailPage(props: { params: Promise<{ id: string }>}) {
    const { id } = await props.params;

    const user = await getUserById(id);

    if(!user) return NotFound();

    console.log(user);

    return (
        <div className="space-y-8 max-w-lg mx-auto">
            <h1 className="h2-bold">Update User</h1>
            <UpdateUserForm user={user} /> 
        </div>
    )
}