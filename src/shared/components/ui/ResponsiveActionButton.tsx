import React from 'react'
import { Button } from './Button'

interface ResponsiveActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    children: React.ReactNode
    className?: string
}

export function ResponsiveActionButton({
    variant = 'primary',
    size,
    loading = false,
    children,
    className = '',
    ...props
}: ResponsiveActionButtonProps) {
    const resolvedSize = size || 'sm'
    const responsiveClasses = 'sm:px-6 sm:py-3 sm:text-base px-3 py-1 text-sm'

    return (
        <Button variant={variant} size={resolvedSize} loading={loading} className={`${responsiveClasses} ${className}`} {...props}>
            {children}
        </Button>
    )
}

export default ResponsiveActionButton
