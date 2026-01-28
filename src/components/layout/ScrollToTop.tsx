import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // We target both the window and any internal scroll containers if they exist
        window.scrollTo(0, 0);

        // In our AppShell, the main content area is often an overflow-y-auto div
        const mainContent = document.querySelector('.overflow-y-auto');
        if (mainContent) {
            mainContent.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}
