import { useEffect, useRef } from 'react';

export function useAutoScroll(dependency: any) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [dependency]);

    return containerRef;
}
