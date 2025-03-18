"use client"

import { useToast } from "@/hooks/use-toast";
import { productDefaultValues } from "@/lib/constants";
import { insertProductSchema, updateProductSchema } from "@/lib/validators";
import { Product } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation"
import { ControllerRenderProps, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import slugify from "slugify";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { createProduct, updateProduct } from "@/lib/actions/product.actions";
import { UploadButton } from "@/lib/uploadthing";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";
import { Checkbox } from "../ui/checkbox";

export function ProductForm(
    { type, product, productId } : 
    { type: 'Create' | 'Update', product?: Product, productId?: string}){

    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof insertProductSchema>>({
        resolver: type === 'Update' ?  zodResolver(updateProductSchema) : zodResolver(insertProductSchema),
        defaultValues: product && type === 'Update' ? product : productDefaultValues
    });

    const onSubmit: SubmitHandler<z.infer<typeof insertProductSchema>> = async (values) => {

        if(type === 'Create') {
            const res = await createProduct(values);
            if(!res.success) {
                toast({
                    variant: 'destructive',
                    description: res.message
                });
            } else {
                toast({                   
                    description: res.message
                });
                router.push('/admin/products')
            }
        } 

        // On Update
        if(type === 'Update') {
            if(!productId) {
                router.push('/admin/products');
                return;
            }
            const res = await updateProduct({...values, id: productId })

            if(!res.success) {
                toast({
                    variant: 'destructive',
                    description: res.message
                });
            } else {
                toast({                   
                    description: res.message
                });
                router.push('/admin/products')
            }
        }
    }

    const images = form.watch('images');
    const isFeatured = form.watch('isFeatured');
    const banner = form.watch('banner');


    return (
        <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-5 md:flex-row">
                    {/* Name */}
                    <FormField control={form.control} name="name" render={({field}: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'name'> })=>(
                        <FormItem className="w-full">
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Product Name" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    {/* Slug */}
                    <FormField control={form.control} name="slug" render={({field}: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'slug'> })=>(
                        <FormItem className="w-full">
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input {...field} placeholder="Enter slug " />
                                    <Button onClick={()=> form.setValue('slug', slugify(form.getValues('name'), { lower: true}))}
                                    type="button" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 mt-2">Generate</Button>

                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="flex flex-col gap-5 md:flex-row">
                    {/* Category */}
                    <FormField control={form.control} name="category" render={({field}: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'category'> })=>(
                        <FormItem className="w-full">
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Product Category" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    {/* Brand */}
                    <FormField control={form.control} name="brand" render={({field}: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'brand'> })=>(
                        <FormItem className="w-full">
                            <FormLabel>Brand</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Product Brand" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="flex flex-col gap-5 md:flex-row">
                    {/* Price */}
                    <FormField control={form.control} name="price" render={({field}: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'price'> })=>(
                        <FormItem className="w-full">
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} placeholder="Product Price" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    {/* Stock */}
                    <FormField control={form.control} name="stock" render={({field}: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'stock'> })=>(
                        <FormItem className="w-full">
                            <FormLabel>Stock</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} placeholder="Product Stock" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="upload-field flex flex-col gap-5 md:flex-row">
                    {/* Images */} 
                    <FormField control={form.control} name="images" render={() => (
                        <FormItem className="w-full">
                            <FormLabel>Images</FormLabel>                            
                            <Card>
                                <CardContent className="space-y-2 mt-2 min-h-48">
                                    <div className="flex-start space-x-2">
                                        {images.map((img: string) => (
                                            <Image key={img} src={img} alt="Product Image" className="w-20 h-20 object-cover  object-center rounded-sm" width={100} height={100} />
                                        ))}
                                        <FormControl>
                                            <UploadButton endpoint="imageUploader" 
                                                onClientUploadComplete={(res: { url: string }[]) =>  { 
                                                    form.setValue('images', [...images, res[0].url])
                                                }}
                                                onUploadError={(error: Error) => {
                                                    toast({
                                                        variant: 'destructive',
                                                        description: error.message
                                                    })
                                                }}
                                             />
                                        </FormControl>
                                    </div>
                                </CardContent>
                            </Card>                            
                            <FormMessage />
                        </FormItem>
                    )} />                   
                </div>
                <div className="upload-field"> 
                    {/* IsFeatured */}
                    Featured Product
                    <Card>
                        <CardContent className="space-y-2 mt-2">
                            <FormField
                                control={form.control}
                                name="isFeatured"
                                render={({field})=> (
                                    <FormItem className="space-x-2 items-center">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange}></Checkbox>
                                        </FormControl>
                                        <FormLabel>Is Featured?</FormLabel>
                                    </FormItem>
                                )}
                            />
                            {   isFeatured && banner && 
                                <Image src={banner} alt="Banner Image" className="w-full object-cover object-center rounded-sm" width={1920} height={680}/> 
                            }
                            {   isFeatured && !banner && <UploadButton endpoint={'imageUploader'} 
                                                onClientUploadComplete={(res: { url: string }[]) =>  { 
                                                    form.setValue('banner', res[0].url)
                                                }}
                                                onUploadError={(error: Error) => {
                                                    toast({
                                                        variant: 'destructive',
                                                        description: error.message
                                                    })
                                                }} />
                            }
                        </CardContent>
                    </Card>
                </div>
                <div>
                    {/* Description */}
                    <FormField control={form.control} name="description" render={({field}: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'description'> })=>(
                        <FormItem className="w-full">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea className="resize-none" {...field} placeholder="Enter product description" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div>
                    {/* Submit */}
                    <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="button col-span-2 w-full">
                        {
                            form.formState.isSubmitting ? "Submitting" : `${type} Product `
                        }
                    </Button>
                </div>
            </form>
        </Form>
    )
}