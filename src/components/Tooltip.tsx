import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    title?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    maxWidth?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
    children,
    content,
    title,
    position = 'right',
    maxWidth = '16rem'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let x = 0;
            let y = 0;
            const offset = 12;
            const tooltipWidth = 280; // Approximate width with padding
            const tooltipHeight = 150; // Approximate height

            // 1. Initial Position Calculation
            switch (position) {
                case 'right':
                    x = rect.right + offset;
                    y = rect.top;
                    break;
                case 'left':
                    x = rect.left - offset - tooltipWidth;
                    y = rect.top;
                    break;
                case 'top':
                    x = rect.left;
                    y = rect.top - offset - tooltipHeight;
                    break;
                case 'bottom':
                    x = rect.left;
                    y = rect.bottom + offset;
                    break;
            }

            // 2. Flip Logic (Horizontal)
            if (position === 'right' && x + tooltipWidth > window.innerWidth) {
                // Flip to left
                x = rect.left - offset - tooltipWidth;
            } else if (position === 'left' && x < 0) {
                // Flip to right
                x = rect.right + offset;
            }

            // 3. Flip Logic (Vertical)
            if (position === 'bottom' && y + tooltipHeight > window.innerHeight) {
                // Flip to top
                y = rect.top - offset - tooltipHeight;
            } else if (position === 'top' && y < 0) {
                // Flip to bottom
                y = rect.bottom + offset;
            }

            // 4. Hard Edge Clamping (Safety Net)
            if (x + tooltipWidth > window.innerWidth - 10) x = window.innerWidth - tooltipWidth - 10;
            if (x < 10) x = 10;
            if (y + tooltipHeight > window.innerHeight - 10) y = window.innerHeight - tooltipHeight - 10;
            if (y < 10) y = 10;

            setCoords({ x, y });
        }
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible]);

    return (
        <div
            ref={triggerRef}
            className="inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && createPortal(
                <div
                    className="animate-fade-in"
                    style={{
                        position: 'fixed',
                        zIndex: 99999,
                        top: `${coords.y}px`,
                        left: `${coords.x}px`,
                        width: maxWidth,
                        pointerEvents: 'none',
                        background: 'rgba(0,0,0,0.95)',
                        border: '1px solid rgba(57, 174, 169, 0.4)',
                        backdropFilter: 'blur(32px) saturate(200%)',
                        boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
                        borderRadius: 'var(--fluid-space-xs, 4px)',
                        padding: 'var(--fluid-space-sm, 1rem)',
                    }}
                >
                    {title && (
                        <div
                            className="font-black mb-2 litho-text uppercase tracking-widest"
                            style={{
                                color: '#E5EFC1',
                                fontSize: 'var(--text-sm, 0.875rem)',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                paddingBottom: '0.375rem'
                            }}
                        >
                            {title}
                        </div>
                    )}
                    <div
                        className="text-[#A2D5AB] opacity-80 font-black uppercase tracking-wider leading-relaxed"
                        style={{ fontSize: 'var(--text-xs, 0.75rem)' }}
                    >
                        {content}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Tooltip;
