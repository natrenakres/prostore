"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";


export function AdminSearch() {
    const pathName = usePathname();
    const formActionUrl = pathName.includes('/admin/orders') ? '/admin/orders' :  pathName.includes('/admin/users') ? '/admin/users' : '/admin/products';
    const searchParams = useSearchParams();
    const [queryValue, setQueryValue] = useState(searchParams.get('query') || '');

    useEffect(()=>{
        setQueryValue(searchParams.get('query') || '')
    }, [searchParams]);
    

    return (
        <form action={formActionUrl} method="GET">
            <Input type="search" placeholder="Search..." name="query" value={queryValue} onChange={(e)=> setQueryValue(e.target.value)} className="md:w-[100px] lg:w-[300px]" />
            <button type="submit" className="sr-only">Search</button>
        </form>
    )
}