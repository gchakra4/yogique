import FocusTrap from 'focus-trap-react';
import React, { useEffect, useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    footer?: React.ReactNode;
    isSubmitting?: boolean;
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    closeOnBackdropClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    footer,
    isSubmitting = false,
}) => {
    const [isMounted, setIsMounted] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) setIsMounted(true);
        else if (isMounted) {
            // start close animation
            setIsClosing(true);
            const t = setTimeout(() => {
                setIsClosing(false);
                setIsMounted(false);
            }, 300);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting) onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, closeOnEscape, isSubmitting, onClose]);

    if (!isMounted) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdropClick && !isSubmitting) {
            onClose();
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4 ${isClosing ? 'pointer-events-none' : ''
                }`}
            aria-hidden={!isOpen}
            onClick={handleBackdropClick}
        >
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${isClosing ? 'opacity-0' : 'opacity-100'} transition-opacity`} />

            <FocusTrap focusTrapOptions={{ initialFocus: false, escapeDeactivates: false, returnFocusOnDeactivate: true }}>
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                    className={`relative w-full ${sizeMap[size]} mx-auto ${isClosing ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'} transform transition-all duration-300`}
                >
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <header className="px-6 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex-1">
                                {title && (
                                    <h2 id="modal-title" className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {title}
                                    </h2>
                                )}
                            </div>

                            {showCloseButton && (
                                <button
                                    aria-label="Close"
                                    onClick={() => !isSubmitting && onClose()}
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </header>

                        <div className="p-6 max-h-[70vh] overflow-auto text-sm text-gray-800 dark:text-slate-200">{children}</div>

                        {footer && <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700">{footer}</div>}
                    </div>
                </div>
            </FocusTrap>
        </div>
    );
};

export default Modal;
