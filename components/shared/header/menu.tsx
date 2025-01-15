import { Button } from "@/components/ui/button";
import { EllipsisVertical, ShoppingCart, UserIcon } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";


function ShoppingCartButton() {

    return (
        <Button asChild variant="ghost">
                        <Link href="/cart">
                            <ShoppingCart /> Cart
                        </Link>
                    </Button>
    )
}

function SignInButton() {

    return (
        <Button asChild>
                        <Link href="/sign-in">
                            <UserIcon /> Sign In
                        </Link>
                    </Button>
    )
}

export function Menu() {

    return (
        <div className="flex justify-end gap-3">
            <nav className="hidden md:flex w-full max-w-xs gap-1">
                    <ModeToggle />
                    <ShoppingCartButton />
                    <SignInButton />
            </nav>
            <nav className="md:hidden">
                <Sheet>
                    <SheetTrigger className="align-middle">
                        <EllipsisVertical />
                    </SheetTrigger>
                    <SheetContent className='flex flex-col items-start'>
                        <SheetTitle>Menu</SheetTitle>
                        <ModeToggle />
                        <ShoppingCartButton />
                        <SignInButton />
                        <SheetDescription></SheetDescription>
                    </SheetContent>
                </Sheet>
            </nav>
        </div>
    )
}