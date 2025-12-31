import { useState, useEffect } from 'react';

export function useMobile(width = 768) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= width);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [width]);

    return isMobile;
}
