const API_URL = 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000';
const WHATSAPP_NUMBER = '94777588738';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        loadProduct(productId, false); // මුලින්ම Page එක Load වන විට
    } else {
        alert('No Product Selected!');
        window.location.href = 'index.html';
    }

    // Browser Back / Forward Button එක ඔබන විටද dynamic ලෙස මාරු වීමට
    window.addEventListener('popstate', () => {
        const currentParams = new URLSearchParams(window.location.search);
        const currentId = currentParams.get('id');
        if (currentId) loadProduct(currentId, false);
    });
});

// Dynamically Product එක Change කරන ප්‍රධාන Function එක (Page Reload වෙන්නේ නැත)
async function loadProduct(id, updateHistory = true) {
    if (updateHistory) {
        // Browser URL එක පමණක් වෙනස් කරයි (Reload නොවී)
        history.pushState({ id }, '', `?id=${id}`);
    }
    
    // Page එක උඩට Scroll කිරීම
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Details Re-fetch කිරීම
    await fetchProductDetails(id);
}

// Theme Toggle
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);

    if (themeIcon) updateThemeIcon(savedTheme, themeIcon);

    if (themeToggleBtn && themeIcon) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme, themeIcon);
        });
    }
}

function updateThemeIcon(theme, iconElement) {
    if (iconElement) {
        iconElement.className = (theme === 'light') ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
}

// Mobile Menu Navigation Toggle
function initMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const nav = document.querySelector('.center-nav');
    const overlay = document.getElementById('overlay');

    if (mobileBtn && nav) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            if (nav) nav.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}

// Helper: Image URL Formatter
function formatImageUrl(path) {
    if (!path) return 'https://via.placeholder.com/500?text=No+Image';
    if (path.startsWith('http')) return path;
    return `${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Fetch Product Details from API
async function fetchProductDetails(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) throw new Error('Product not found');

        const product = await response.json();

        // Details Populate කිරීම
        const titleEl = document.getElementById('productTitle');
        const categoryEl = document.getElementById('productCategory');
        const descEl = document.getElementById('productDesc');

        // Product Name
        if (titleEl) titleEl.innerText = product.product_title || product.name || 'Product Details';
        
        // Sport Name සහ Category Name
        if (categoryEl) {
            const sportText = product.sport_name ? product.sport_name.toUpperCase() : 'GENERAL';
            const catText = product.category_name ? product.category_name.toUpperCase() : 'CUSTOM GEAR';
            categoryEl.innerText = `${sportText} • ${catText}`;
        }

        // DATABASE එකෙන් එන DESCRIPTION එක හරියාකාරව පෙන්වීම
        if (descEl) {
            if (product.description && product.description.trim() !== '') {
                // Admin Panel එකේදී Enter ගසා කඩන ලද Line breaks (\n) HTML <br> බවට පත් කරයි
                descEl.innerHTML = product.description.replace(/\n/g, '<br>');
            } else {
                descEl.innerText = 'High-quality custom sportswear tailored to perfection.';
            }
        }

        // Gallery Setup
        const images = (product.images && product.images.length > 0) 
            ? product.images 
            : [product.image_url];

        setupGallery(images);
        setupWhatsAppButton(product);

        // අදාළ Sport එකේම වෙනත් Products (Related Products) Load කිරීම
        if (product.sport_id) {
            fetchRelatedProducts(product.sport_id, product.id);
        } else {
            hideRelatedProducts();
        }

    } catch (error) {
        console.error('Error fetching product:', error);
        const titleEl = document.getElementById('productTitle');
        if (titleEl) titleEl.innerText = 'Product Not Found';
    }
}

// Same Sport Related Products Fetch කිරීම
async function fetchRelatedProducts(sportId, currentProductId) {
    const relatedContainer = document.getElementById('relatedProductsList');
    if (!relatedContainer) return;

    try {
        const res = await fetch(`${API_URL}/products?sport=${sportId}`);
        const data = await res.json();
        const products = Array.isArray(data) ? data : (data.data || []);

        // දැනට පෙන්වන Product එක ලිස්ට් එකෙන් ඉවත් කිරීම
        const related = products.filter(p => parseInt(p.id) !== parseInt(currentProductId));

        if (related.length === 0) {
            relatedContainer.innerHTML = '<p class="no-related">No other items in this sport.</p>';
            return;
        }

        relatedContainer.innerHTML = '';
        related.forEach(p => {
            const item = document.createElement('div');
            item.className = 'related-card';
            const imgUrl = formatImageUrl(p.image_url || p.image);

            item.innerHTML = `
                <img src="${imgUrl}" alt="${p.name || 'Product'}">
                <div class="related-info">
                    <h4>${p.name || p.product_title || 'Item'}</h4>
                    <span>${p.category_name || 'View Details'}</span>
                </div>
            `;

            // Dynamic Click Handler (Page Reload නොවී අලුත් Product එක load වේ)
            item.addEventListener('click', () => {
                loadProduct(p.id, true);
            });

            relatedContainer.appendChild(item);
        });

    } catch (err) {
        console.error('Error fetching related products:', err);
    }
}

function hideRelatedProducts() {
    const relatedContainer = document.getElementById('relatedProductsList');
    if (relatedContainer) relatedContainer.innerHTML = '<p class="no-related">No other items found.</p>';
}

// Main Image, Thumbnail & Zoom Gallery Logic
function setupGallery(images) {
    const mainImg = document.getElementById('mainImage');
    const thumbRow = document.getElementById('thumbnailRow');

    if (!mainImg || !thumbRow) return;

    mainImg.src = formatImageUrl(images[0]);
    thumbRow.innerHTML = '';

    images.forEach((imgUrl, index) => {
        const fullUrl = formatImageUrl(imgUrl);
        const thumb = document.createElement('img');
        thumb.src = fullUrl;
        thumb.className = `thumb-img ${index === 0 ? 'active' : ''}`;

        thumb.onclick = () => {
            mainImg.src = fullUrl;
            document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        };

        thumbRow.appendChild(thumb);
    });

    // Hover Zoom Effect
    const zoomBox = document.getElementById('zoomBox');
    
    if (zoomBox) {
        zoomBox.onmousemove = (e) => {
            const rect = zoomBox.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            mainImg.style.transformOrigin = `${x}% ${y}%`;
            mainImg.style.transform = 'scale(2.2)';
        };

        zoomBox.onmouseleave = () => {
            mainImg.style.transform = 'scale(1)';
            mainImg.style.transformOrigin = 'center center';
        };
    }
}

// WhatsApp Link Setup (Price/LKR ඉවත් කර ඇත)
function setupWhatsAppButton(product) {
    const pageUrl = window.location.href;
    const productName = product.product_title || product.name || 'Product';
    const sportName = product.sport_name || 'General';

    const message = `Hello! I would like to inquire about this custom item:
📌 *Product:* ${productName}
🏆 *Sport:* ${sportName}
🔗 *Link:* ${pageUrl}`;

    const waBtn = document.getElementById('whatsappBtn');
    if (waBtn) {
        waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }
}