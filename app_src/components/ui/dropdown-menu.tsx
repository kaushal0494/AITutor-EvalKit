"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextType {
    open: boolean
    setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | null>(null)

interface DropdownMenuProps {
    children: React.ReactNode
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
    const [open, setOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false)
            }
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside)
            document.addEventListener("keydown", handleEscape)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleEscape)
        }
    }, [open])

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative" ref={dropdownRef}>
                {children}
            </div>
        </DropdownMenuContext.Provider>
    )
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(DropdownMenuContext)
        if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu")

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 h-10 px-4 py-2",
                    className,
                )}
                onClick={() => context.setOpen(!context.open)}
                {...props}
            >
                {children}
                <ChevronDown className={cn("h-4 w-4 transition-transform", context.open && "rotate-180")} />
            </button>
        )
    },
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps {
    children: React.ReactNode
    className?: string
    align?: "start" | "center" | "end"
}

const DropdownMenuContent = ({ children, className, align = "end" }: DropdownMenuContentProps) => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu")

    if (!context.open) return null

    const alignmentClasses = {
        start: "left-0",
        center: "left-1/2 -translate-x-1/2",
        end: "right-0",
    }

    return (
        <div
            className={cn(
                "absolute top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-lg animate-in fade-in-0 zoom-in-95",
                alignmentClasses[align],
                className,
            )}
        >
            <div className="p-1">{children}</div>
        </div>
    )
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

const DropdownMenuItem = ({ className, children, onClick, ...props }: DropdownMenuItemProps) => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu")

    return (
        <div
            className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
                className,
            )}
            onClick={(e) => {
                onClick?.(e)
                context.setOpen(false)
            }}
            {...props}
        >
            {children}
        </div>
    )
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
