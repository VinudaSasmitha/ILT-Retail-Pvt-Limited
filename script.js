document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;

    // 1. Saved Theme එක පරීක්ෂා කර යෙදීම (Default: Dark Theme)
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // 2. Button Click එකේදී Theme Switch වීම
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
        
        // Theme Update කිරීම
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // 3. Theme එකට අනුව Icon එක (Sun/Moon) වෙනස් කිරීම
    function updateThemeIcon(theme) {
        if (theme === 'light') {
            themeIcon.className = 'fa-solid fa-moon'; // Light mode ඇති විට Moon icon එක පෙන්වයි
        } else {
            themeIcon.className = 'fa-solid fa-sun';  // Dark mode ඇති විට Sun icon එක පෙන්වයි
        }
    }
});