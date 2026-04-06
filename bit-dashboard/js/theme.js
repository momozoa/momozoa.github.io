/**
 * Theme Manager for BIT Dashboard
 * Handles theme switching and persistence
 */

export function initTheme() {
    const themeSelector = document.getElementById('theme-selector');
    const savedTheme = localStorage.getItem('bit-dashboard-theme') || 'dark';

    // Apply saved theme on load
    applyTheme(savedTheme);

    if (themeSelector) {
        themeSelector.value = savedTheme;

        themeSelector.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            applyTheme(newTheme);
            localStorage.setItem('bit-dashboard-theme', newTheme);
        });
    }
}

function applyTheme(theme) {
    // Set data-theme attribute on document body
    document.documentElement.setAttribute('data-theme', theme);

    // Dispatch event for other components (like Charts) to update if needed
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}
