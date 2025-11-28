import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const IconCircleButton = React.forwardRef(function IconCircleButton({ children, className = '', ...rest }, ref) {
    return (_jsx("button", { ...rest, ref: ref, className: `h-11 w-11 rounded-full flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 shadow-sm ${className}`, children: children }));
});
export default IconCircleButton;
