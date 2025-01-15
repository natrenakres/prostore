import { cn } from "@/lib/utils";


export function ProductPrice({value, className}: {value: number, className?: string}){
    // Ensure two decimal places
    const stringVlaue = value.toFixed(2);
    // Get the int/float
    const [intValue, floatValue] =  stringVlaue.split('.');


    return (
        <p className={cn('text-2xl', className)}>
            <span className="text-xs align-super">$</span>
            {intValue}
            <span className="text-xs align-super">.{floatValue}</span>

        </p>
    )

}