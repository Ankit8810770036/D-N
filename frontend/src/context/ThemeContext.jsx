import { createContext, useContext, useEffect, useState } from 'react';

const defaultTheme = { isDarkMode: true, toggleTheme: () => {} };
const ThemeContext = createContext(defaultTheme);

export function ThemeProvider({ children }) {
    // Default to dark mode to match the beautiful new aesthetic, unless they specifically chose light mode.
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            const stored = localStorage.getItem('theme');
            return stored ? stored === 'dark' : true;
        } catch (_) {
            return true;
        }
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    return context || defaultTheme;
};

