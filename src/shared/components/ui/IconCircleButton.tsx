import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    'aria-label': string
}

const IconCircleButton = React.forwardRef<HTMLButtonElement, Props>(function IconCircleButton(
    { children, className = '', ...rest },
    ref
) {
    return (
        <button
            {...rest}
            ref={ref}
            className={
                `h-11 w-11 rounded-full flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 shadow-sm ${className}`
            }
        >
            {children}
        </button>
    )
})

export default IconCircleButton
