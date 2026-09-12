const API_URL = 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. DARK / LIGHT THEME TOGGLE LOGIC
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;

    if (themeToggleBtn && themeIcon) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        htmlElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });

        function updateThemeIcon(theme) {
            themeIcon.className = (theme === 'light') ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        }
    }

    // ==========================================
    // 2. PAGE LOAD ENGINES
    // ==========================================
    if (document.getElementById('sportsGrid')) {
        fetchSportsCategories();
    }
    if (document.getElementById('categoriesGrid')) {
        fetchItemCategories();
    }
    if (document.getElementById('productsGrid')) {
        fetchFeaturedProducts();
    }
});

// Image URL එක නිවැරදිව සකසන Helper Function එක
function formatImageUrl(path) {
    if (!path) return 'https://via.placeholder.com/300x200?text=No+Image';
    if (path.startsWith('http')) return path;
    return `${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ==========================================
// 3. FETCH SPORTS CATEGORIES
// ==========================================
async function fetchSportsCategories() {
    const sportsGrid = document.getElementById('sportsGrid');
    if (!sportsGrid) return;

    try {
        const response = await fetch(`${API_URL}/sports`);
        if (!response.ok) throw new Error(`Server status: ${response.status}`);
        
        const result = await response.json();
        const sportsList = Array.isArray(result) ? result : (result.data || []);

        if (!sportsList || sportsList.length === 0) {
            sportsGrid.innerHTML = `
                <p style="color: var(--text-dim); text-align: center; grid-column: 1/-1;">
                    No sports categories added yet.
                </p>`;
            return;
        }

        sportsGrid.innerHTML = '';

        sportsList.forEach(sport => {
            const isFontAwesome = sport.icon && sport.icon.startsWith('fa-');
            const imgSrc = formatImageUrl(sport.icon);

            const bannerHTML = isFontAwesome
                ? `<div class="sport-card-banner">
                    <div class="sport-icon-box"><i class="${sport.icon}"></i></div>
                   </div>`
                : `<div class="sport-card-banner">
                    <img src="${imgSrc}" alt="${sport.name}">
                   </div>`;

            const cardHTML = `
                <div class="sport-card" onclick="window.location.href='category.html?sport_id=${sport.id}'">
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
                Failed to load sports categories. Please check backend server.
            </p>`;
    }
}

// ==========================================
// 4. FETCH ITEM CATEGORIES (Optional Grid)
// ==========================================
async function fetchItemCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;

    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();

        if (!categories || categories.length === 0) {
            categoriesGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">No categories available.</p>';
            return;
        }

        categoriesGrid.innerHTML = '';
        categories.forEach(cat => {
            const imgSrc = formatImageUrl(cat.image_url);
            categoriesGrid.innerHTML += `
                <div class="category-card" onclick="window.location.href='category.html?category_id=${cat.id}'">
                    <img src="${imgSrc}" alt="${cat.name}">
                    <h4>${cat.name}</h4>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// ==========================================
// 5. FETCH FEATURED PRODUCTS (Optional Grid)
// ==========================================
async function fetchFeaturedProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        if (!products || products.length === 0) {
            productsGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">No products found.</p>';
            return;
        }

        productsGrid.innerHTML = '';
        products.forEach(p => {
            const imgSrc = formatImageUrl(p.image_url);
            productsGrid.innerHTML += `
                <div class="product-card">
                    <img src="${imgSrc}" alt="${p.name}">
                    <span class="badge">${p.sport_name || 'General'}</span>
                    <h3>${p.name}</h3>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}