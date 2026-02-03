import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg" | "xl" | "full"
    children: React.ReactNode
}

/**
 * A layout primitive to ensure consistent padding and maximum widths across the application.
 * Satisfies UR-R0.1 (Responsive layouts) by ensuring content doesn't overflow on mobile (~360px).
 */
export function ResponsiveContainer({
    className,
    size = "lg",
    ...props
}: ResponsiveContainerProps) {
    return (
        <div
            className={cn(
                "w-full mx-auto px-4 sm:px-6", // p-4 on mobile (16px), p-6 on tablet+ (24px)
                {
                    "max-w-md": size === "sm",      // Participant screens
                    "max-w-2xl": size === "md",     // Focused forms
                    "max-w-4xl": size === "lg",     // Standard professor dashboards
                    "max-w-7xl": size === "xl",     // Wide reports/tables
                    "max-w-full": size === "full",  // Full width
                },
                className
            )}
            {...props}
        />
    )
}
