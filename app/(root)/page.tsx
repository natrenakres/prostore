import { ProductCarusel } from "@/components/shared/product/product-carusel";
import { ProductList } from "@/components/shared/product/product-list"
import { ViewAllProductsButton } from "@/components/view-all-products-button";
import { getFeaturedProducts, getLatestProducts } from "@/lib/actions/product.actions"


export default async function HomePage(){
  const latestProducts = await getLatestProducts();
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
      {
        featuredProducts.length > 0 && <ProductCarusel data={featuredProducts} />
      }
      <ProductList data={latestProducts} title="Newest Arrivals" />
      <ViewAllProductsButton />
    </>  
  )
}