const r=`import React, { useState, useEffect, useRef } from 'react';\r
import { createPortal } from 'react-dom';\r
\r
interface TooltipProps {\r
    children: React.ReactNode;\r
    content: React.ReactNode;\r
    title?: string;\r
    position?: 'top' | 'bottom' | 'left' | 'right';\r
    maxWidth?: string;\r
}\r
\r
const Tooltip: React.FC<TooltipProps> = ({\r
    children,\r
    content,\r
    title,\r
    position = 'right',\r
    maxWidth = '16rem'\r
}) => {\r
    const [isVisible, setIsVisible] = useState(false);\r
    const [coords, setCoords] = useState({ x: 0, y: 0 });\r
    const triggerRef = useRef<HTMLDivElement>(null);\r
\r
    const updatePosition = () => {\r
        if (triggerRef.current) {\r
            const rect = triggerRef.current.getBoundingClientRect();\r
            let x = 0;\r
            let y = 0;\r
            const offset = 12;\r
            const tooltipWidth = 280; // Approximate width with padding\r
            const tooltipHeight = 150; // Approximate height\r
\r
            // 1. Initial Position Calculation\r
            switch (position) {\r
                case 'right':\r
                    x = rect.right + offset;\r
                    y = rect.top;\r
                    break;\r
                case 'left':\r
                    x = rect.left - offset - tooltipWidth;\r
                    y = rect.top;\r
                    break;\r
                case 'top':\r
                    x = rect.left;\r
                    y = rect.top - offset - tooltipHeight;\r
                    break;\r
                case 'bottom':\r
                    x = rect.left;\r
                    y = rect.bottom + offset;\r
                    break;\r
            }\r
\r
            // 2. Flip Logic (Horizontal)\r
            if (position === 'right' && x + tooltipWidth > window.innerWidth) {\r
                // Flip to left\r
                x = rect.left - offset - tooltipWidth;\r
            } else if (position === 'left' && x < 0) {\r
                // Flip to right\r
                x = rect.right + offset;\r
            }\r
\r
            // 3. Flip Logic (Vertical)\r
            if (position === 'bottom' && y + tooltipHeight > window.innerHeight) {\r
                // Flip to top\r
                y = rect.top - offset - tooltipHeight;\r
            } else if (position === 'top' && y < 0) {\r
                // Flip to bottom\r
                y = rect.bottom + offset;\r
            }\r
\r
            // 4. Hard Edge Clamping (Safety Net)\r
            if (x + tooltipWidth > window.innerWidth - 10) x = window.innerWidth - tooltipWidth - 10;\r
            if (x < 10) x = 10;\r
            if (y + tooltipHeight > window.innerHeight - 10) y = window.innerHeight - tooltipHeight - 10;\r
            if (y < 10) y = 10;\r
\r
            setCoords({ x, y });\r
        }\r
    };\r
\r
    useEffect(() => {\r
        if (isVisible) {\r
            updatePosition();\r
            window.addEventListener('scroll', updatePosition);\r
            window.addEventListener('resize', updatePosition);\r
        }\r
        return () => {\r
            window.removeEventListener('scroll', updatePosition);\r
            window.removeEventListener('resize', updatePosition);\r
        };\r
    }, [isVisible]);\r
\r
    return (\r
        <div\r
            ref={triggerRef}\r
            className="inline-block"\r
            onMouseEnter={() => setIsVisible(true)}\r
            onMouseLeave={() => setIsVisible(false)}\r
        >\r
            {children}\r
            {isVisible && createPortal(\r
                <div\r
                    className="animate-fade-in"\r
                    style={{\r
                        position: 'fixed',\r
                        zIndex: 99999,\r
                        top: \`\${coords.y}px\`,\r
                        left: \`\${coords.x}px\`,\r
                        width: maxWidth,\r
                        pointerEvents: 'none',\r
                        background: 'rgba(0,0,0,0.95)',\r
                        border: '1px solid rgba(57, 174, 169, 0.4)',\r
                        backdropFilter: 'blur(32px) saturate(200%)',\r
                        boxShadow: '0 12px 48px rgba(0,0,0,0.8)',\r
                        borderRadius: 'var(--fluid-space-xs, 4px)',\r
                        padding: 'var(--fluid-space-sm, 1rem)',\r
                    }}\r
                >\r
                    {title && (\r
                        <div\r
                            className="font-black mb-2 litho-text uppercase tracking-widest"\r
                            style={{\r
                                color: '#E5EFC1',\r
                                fontSize: 'var(--text-sm, 0.875rem)',\r
                                borderBottom: '1px solid rgba(255,255,255,0.1)',\r
                                paddingBottom: '0.375rem'\r
                            }}\r
                        >\r
                            {title}\r
                        </div>\r
                    )}\r
                    <div\r
                        className="text-[#A2D5AB] opacity-80 font-black uppercase tracking-wider leading-relaxed"\r
                        style={{ fontSize: 'var(--text-xs, 0.75rem)' }}\r
                    >\r
                        {content}\r
                    </div>\r
                </div>,\r
                document.body\r
            )}\r
        </div>\r
    );\r
};\r
\r
export default Tooltip;\r
`;export{r as default};
