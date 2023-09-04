/**
 * Switches the favicon based on the user's preferred color scheme.
 * This function checks if dark mode is enabled and updates the favicon accordingly.
 */
function switchFavicon() {
    // Check if dark mode is enabled using the 'prefers-color-scheme' media feature
    const darkModeOn = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Get the favicon element from the HTML document
    const favicon = document.getElementById('favicon');

    // Update the favicon based on the color scheme
    if (darkModeOn) {
        favicon.href = '/images/favicon-dark.ico';
    } else {
        favicon.href = '/images/favicon-light.ico';
    }
}

// Set the favicon based on the initial color scheme when the page loads
switchFavicon();

// Listen for changes to the user's preferred color scheme, if the browser supports it
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', e => switchFavicon());
}