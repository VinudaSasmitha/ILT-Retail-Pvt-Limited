document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. DARK / LIGHT THEME TOGGLE LOGIC
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;

    if (themeToggleBtn && themeIcon) {
        // Saved Theme එක පරීක්ෂා කර යෙදීම (Default: Dark Theme)
        const savedTheme = localStorage.getItem('theme') || 'dark';
        htmlElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        // Button Click එකේදී Theme Switch වීම
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });

        // Theme එකට අනුව Icon එක (Sun/Moon) වෙනස් කිරීම
        function updateThemeIcon(theme) {
            if (theme === 'light') {
                themeIcon.className = 'fa-solid fa-moon'; // Light mode ඇති විට Moon icon
            } else {
                themeIcon.className = 'fa-solid fa-sun';  // Dark mode ඇති විට Sun icon
            }
        }
    }

    // ==========================================
    // 2. PAGE LOAD ENGINES
    // ==========================================
    // sportsGrid Element එක පිටුවේ තිබේ නම් පමණක් Data Fetch කරන්න
    if (document.getElementById('sportsGrid')) {
        fetchSportsCategories();
    }
});

// ==========================================
// 3. FETCH SPORTS CATEGORIES FUNCTION
// ==========================================
async function fetchSportsCategories() {
    const sportsGrid = document.getElementById('sportsGrid');
    if (!sportsGrid) return;

    try {
        const response = await fetch('http://localhost:3000/api/sports');
        if (!response.ok) throw new Error(`Server status: ${response.status}`);
        
        const result = await response.json();
        const sportsList = Array.isArray(result) ? result : (result.data || []);

        if (!sportsList || sportsList.length === 0) {
            sportsGrid.innerHTML = `
                <p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">
                    No sports categories added yet from Admin Panel.
                </p>`;
            return;
        }

        sportsGrid.innerHTML = '';

        sportsList.forEach(sport => {
            const isFontAwesome = sport.icon && sport.icon.startsWith('fa-');
            const imgSrc = sport.icon ? 'http://localhost:3000' + sport.icon : '/uploads/default.png';

            const bannerHTML = isFontAwesome
                ? `<div class="sport-card-banner">
                    <div class="sport-icon-box"><i class="${sport.icon}"></i></div>
                   </div>`
                : `<div class="sport-card-banner">
                    <img src="${imgSrc}" alt="${sport.name}">
                   </div>`;

            // Card එකේ ඕනෑම තැනක් Click කළ විට Navigate වන සේ onclick එකතු කර ඇත
            const cardHTML = `
                <div class="sport-card" onclick="window.location.href='/category.html?id=${sport.id}'">
                    ${bannerHTML}
                    <span class="item-count">${sport.product_count || 0} Products</span>
                    
                    <div class="sport-info">
                        <h3>${sport.name}</h3>
                        <p>${sport.description || 'Custom sportswear and gear.'}</p>
                    </div>

                    <div class="sport-footer">
                        <span>Explore Collection</span>
                        <div class="sport-link-btn">
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>
            `;

            sportsGrid.insertAdjacentHTML('beforeend', cardHTML);
        });

    } catch (error) {
        console.error('Error loading sports:', error);
        sportsGrid.innerHTML = `
            <p style="color: #dc2626; text-align: center; grid-column: 1/-1;">
                Failed to load categories. Please check backend server.
            </p>`;
    }
}