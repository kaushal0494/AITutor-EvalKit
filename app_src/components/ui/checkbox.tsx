"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, onCheckedChange, ...props }, ref) => {
    return (
        <div className="relative">
            <input
                type="checkbox"
                className="sr-only"
                ref={ref}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                {...props}
            />
            <div
                className={cn(
                    "peer h-4 w-4 shrink-0 rounded-sm border border-blue-600 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white",
                    props.checked ? "bg-blue-600 text-white" : "bg-white",
                    className,
                )}
                onClick={() => {
                    const newChecked = !props.checked
                    onCheckedChange?.(newChecked)
                }}
            >
                {props.checked && (
                    <div className="flex items-center justify-center text-current">
                        <Check className="h-4 w-4" />
                    </div>
                )}
            </div>
        </div>
    )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
