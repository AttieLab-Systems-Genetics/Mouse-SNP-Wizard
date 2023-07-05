function switchFavicon() {
    const darkModeOn = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const favicon = document.getElementById('favicon');
    if (darkModeOn) {
        favicon.href = '/images/favicon-dark.ico';
    } else {
        favicon.href = '/images/favicon-light.ico';
    }
}

// Call the function to set the favicon on initial page load
switchFavicon();

// If the browser supports it, listen for changes to the color scheme
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => switchFavicon());
}
