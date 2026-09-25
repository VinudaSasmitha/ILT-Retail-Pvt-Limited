const API_URL = 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000';
const WHATSAPP_NUMBER = '94777588738';

// Filter State Logic
let currentFilters = {
    sport: 'all',
    category: 'all',
    type: 'all'
};

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
    // 2. FILTER DROPDOWNS & RESET LISTENERS
    // ==========================================
    const sportFilter = document.getElementById('sportFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (sportFilter) {
        sportFilter.addEventListener('change', (e) => {
            currentFilters.sport = e.target.value;
            applyFilterChanges();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            applyFilterChanges();
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            currentFilters.type = e.target.value;
            applyFilterChanges();
        });
    }

    // Reset Buttons
    document.getElementById('resetBtn')?.addEventListener('click', resetAllFilters);
    document.getElementById('clearTagBtn')?.addEventListener('click', resetAllFilters);
    document.getElementById('showAllBtn')?.addEventListener('click', resetAllFilters);

    // ==========================================
    // 3. PAGE LOAD ENGINES
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

// Helper: Image URL Formatter
function formatImageUrl(path) {
    if (!path) return 'https://via.placeholder.com/300x200?text=No+Image';
    if (path.startsWith('http')) return path;
    return `${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Helper: Smooth Scroll to Catalog Section
function scrollToCatalog() {
    const catalogSection = document.getElementById('featured-products') || document.getElementById('catalog');
    if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Helper: WhatsApp URL Generator
function getWaLink(productTitle) {
    const text = `Inquiry: ${productTitle}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

// ==========================================
// 4. ON-CARD CLICK LOGIC (SPORTS & CATEGORIES)
// ==========================================
window.selectSport = function(sportId) {
    currentFilters.sport = sportId;
    currentFilters.category = 'all';
    currentFilters.type = 'all';

    syncDropdownUI();
    applyFilterChanges();
    scrollToCatalog();
};

window.selectCategory = function(categoryId) {
    currentFilters.category = categoryId;
    currentFilters.sport = 'all';
    currentFilters.type = 'all';

    syncDropdownUI();
    applyFilterChanges();
    scrollToCatalog();
};

// Sync State with UI Dropdowns
function syncDropdownUI() {
    const sportFilter = document.getElementById('sportFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (sportFilter) sportFilter.value = currentFilters.sport;
    if (categoryFilter) categoryFilter.value = currentFilters.category;
    if (typeFilter) typeFilter.value = currentFilters.type;
}

// Active Yellow Tag Display
function updateActiveTag() {
    const activeRow = document.getElementById('activeFilterRow');
    const activeTag = document.getElementById('activeFilterTag');

    if (!activeRow || !activeTag) return;

    const sportFilter = document.getElementById('sportFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    let tags = [];
    if (currentFilters.sport !== 'all' && sportFilter) {
        const sportText = sportFilter.options[sportFilter.selectedIndex]?.text || currentFilters.sport;
        tags.push(`Sport: ${sportText}`);
    }
    if (currentFilters.category !== 'all' && categoryFilter) {
        const catText = categoryFilter.options[categoryFilter.selectedIndex]?.text || currentFilters.category;
        tags.push(`Category: ${catText}`);
    }
    if (currentFilters.type !== 'all') {
        tags.push(`Type: ${currentFilters.type}`);
    }

    if (tags.length > 0) {
        activeTag.innerText = tags.join(' | ');
        activeRow.classList.remove('hidden');
    } else {
        activeRow.classList.add('hidden');
    }
}

// Apply Filters and Re-fetch
function applyFilterChanges() {
    updateActiveTag();
    fetchFeaturedProducts();
}

// Reset All Filters
function resetAllFilters() {
    currentFilters = { sport: 'all', category: 'all', type: 'all' };
    syncDropdownUI();
    applyFilterChanges();
}

// ==========================================
// 5. FETCH SPORTS CATEGORIES
// ==========================================
async function fetchSportsCategories() {
    const sportsGrid = document.getElementById('sportsGrid');
    const sportSelect = document.getElementById('sportFilter');

    try {
        const response = await fetch(`${API_URL}/sports`);
        if (!response.ok) throw new Error(`Server status: ${response.status}`);
        
        const result = await response.json();
        const sportsList = Array.isArray(result) ? result : (result.data || []);

        if (sportSelect) {
            sportSelect.innerHTML = `<option value="all">All Sports</option>`;
        }

        if (!sportsList || sportsList.length === 0) {
            if (sportsGrid) {
                sportsGrid.innerHTML = `
                    <p style="color: var(--text-dim); text-align: center; grid-column: 1/-1;">
                        No sports categories added yet.
                    </p>`;
            }
            return;
        }

        if (sportsGrid) sportsGrid.innerHTML = '';

        sportsList.forEach(sport => {
            // Dropdown Populating
            if (sportSelect) {
                sportSelect.insertAdjacentHTML('beforeend', `<option value="${sport.id}">${sport.name}</option>`);
            }

            // Cards Populating
            if (sportsGrid) {
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
                    <div class="sport-card" onclick="selectSport('${sport.id}')">
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
            }
        });

    } catch (error) {
        console.error('Error loading sports:', error);
        if (sportsGrid) {
            sportsGrid.innerHTML = `
                <p style="color: #dc2626; text-align: center; grid-column: 1/-1;">
                    Failed to load sports categories. Please check backend server.
                </p>`;
        }
    }
}

// ==========================================
// 6. FETCH ITEM CATEGORIES
// ==========================================
async function fetchItemCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    const categorySelect = document.getElementById('categoryFilter');

    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();

        if (categorySelect) {
            categorySelect.innerHTML = `<option value="all">All Types</option>`;
        }

        if (!categories || categories.length === 0) {
            if (categoriesGrid) categoriesGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">No categories available.</p>';
            return;
        }

        if (categoriesGrid) categoriesGrid.innerHTML = '';

        categories.forEach(cat => {
            // Dropdown Populating
            if (categorySelect) {
                categorySelect.insertAdjacentHTML('beforeend', `<option value="${cat.id}">${cat.name}</option>`);
            }

            // Grid Populating
            if (categoriesGrid) {
                const imgSrc = formatImageUrl(cat.image_url);
                categoriesGrid.innerHTML += `
                    <div class="category-card" onclick="selectCategory('${cat.id}')">
                        <img src="${imgSrc}" alt="${cat.name}">
                        <h4>${cat.name}</h4>
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

/// ==========================================
// 7. FETCH & FILTER PRODUCTS
// ==========================================
async function fetchFeaturedProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    const countDisplay = document.getElementById('productCount');

    if (!productsGrid) return;

    try {
        const params = new URLSearchParams();
        if (currentFilters.sport !== 'all') params.append('sport', currentFilters.sport);
        if (currentFilters.category !== 'all') params.append('category', currentFilters.category);
        if (currentFilters.type !== 'all') params.append('type', currentFilters.type);

        const response = await fetch(`${API_URL}/products?${params.toString()}`);
        const products = await response.json();

        const count = products ? products.length : 0;
        if (countDisplay) {
            countDisplay.innerHTML = `Showing <strong style="color:var(--text-main, #fff);">${count}</strong> Products`;
        }

        if (!products || count === 0) {
            productsGrid.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');
        productsGrid.innerHTML = '';

        products.forEach(p => {
            const imgSrc = formatImageUrl(p.image_url);
            const title = p.product_title || p.name;

            productsGrid.innerHTML += `
                <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'" style="cursor: pointer;">
                    <div class="product-img-wrapper">
                        <img src="${imgSrc}" alt="${title}">
                        <button class="wishlist-btn" title="Add to Wishlist" onclick="event.stopPropagation();">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                    </div>
                    <div class="product-info">
                        <span class="product-category">${p.sport_name || 'CUSTOM GEAR'}</span>
                        <h3 class="product-title">${title}</h3>
                        <a href="product-detail.html?id=${p.id}" class="btn-inquire-red" onclick="event.stopPropagation();">
                            <i class="fa-solid fa-eye"></i>
                            <span>VIEW DETAILS</span>
                        </a>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#dc2626;">Failed to fetch products.</p>';
    }
}