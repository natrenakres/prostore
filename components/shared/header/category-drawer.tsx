import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { getAllCategories } from "@/lib/actions/product.actions";
import { Menu } from "lucide-react";
import Link from "next/link";



export async function CategoryDrawer() {
    const data = await getAllCategories();



    return (
        <Drawer direction="left">
            <DrawerTrigger asChild>
                <Button variant="outline">
                    <Menu />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-full max-w-sm">
                <DrawerTitle>Select Category</DrawerTitle>
                <div className="space-y-1 mt-4">
                    {
                        data?.map(category => (
                            <Button variant="ghost" className="w-full justify-start" key={category.category} asChild>
                                <DrawerClose asChild>
                                    <Link href={`/search?category=${category.category}`}>{category.category} ({category._count})</Link>
                                </DrawerClose>
                            </Button>
                        ))
                    }
                </div>
            </DrawerContent>
        </Drawer>
    )

}