import { jsx as _jsx } from "react/jsx-runtime";
import { Button } from './Button';
export function ResponsiveActionButton({ variant = 'primary', size, loading = false, children, className = '', ...props }) {
    const resolvedSize = size || 'sm';
    // Match the compact mobile sizing used in AdminClassesOverview: slightly denser padding and smaller text
    // while keeping the larger, more prominent sizing at sm+ breakpoints.
    const responsiveClasses = 'sm:px-6 sm:py-3 sm:text-base px-3 py-2 text-xs';
    return (_jsx(Button, { variant: variant, size: resolvedSize, loading: loading, className: `${responsiveClasses} ${className}`, ...props, children: children }));
}
export default ResponsiveActionButton;
