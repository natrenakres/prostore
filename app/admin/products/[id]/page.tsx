import NotFound from "@/app/not-found";
import { ProductForm } from "@/components/admin/product-form";
import { getProductById } from "@/lib/actions/product.actions";
import { Metadata } from "next";


export const metadata: Metadata = {
    title: 'Update Product'
}

export default async function AdminProductUpdatePage(props: { params: Promise<{id: string}>}) {
    const {id } = await props.params;
    console.log(id);

    const product = await getProductById(id);

    if(!product) {
        return NotFound();
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <h1 className="h2-bold">Update Product</h1>
            <ProductForm type="Update" product={product} productId={id} />
        </div>
    )

}