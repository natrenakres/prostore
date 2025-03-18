import { Button } from "./ui/button";
import Link from "next/link";

export function ViewAllProductsButton() {


    return (
        <div className=" flex justify-center items-center">
            <Button asChild className="px-8 py-4 text-lg font-semibold">
                <Link href="/search">View All Products</Link>
            </Button>
        </div>
    )
}