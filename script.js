// Global Variables
let categories = [];
let products = [];
let currentEditingId = null;
const ADMIN_PASSWORD = 'hamidmtd321'; // In production, this should be more secure

// Supabase Tables
const CATEGORIES_TABLE = 'categories';
const PRODUCTS_TABLE = 'products';

// Supabase Helper Functions
function getSupabase() {
    if (!window.supabaseClient) {
        throw new Error('Supabase not initialized. Please check your Supabase configuration.');
    }
    return window.supabaseClient;
}

// Real-time subscriptions
let categoriesSubscription = null;
let productsSubscription = null;

// Database Functions
async function loadCategories() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(CATEGORIES_TABLE)
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        categories = data || [];
        console.log('Categories loaded:', categories);
        return categories;
    } catch (error) {
        console.error('Error loading categories:', error);
        showMessage('خطا در بارگذاری دسته‌بندی‌ها', 'error');
        return [];
    }
}

async function loadProducts() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(PRODUCTS_TABLE)
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        products = data || [];
        console.log('Products loaded:', products);
        return products;
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('خطا در بارگذاری محصولات', 'error');
        return [];
    }
}

async function saveCategory(categoryData) {
    try {
        const supabase = getSupabase();
        
        if (currentEditingId) {
            // Update existing category
            const { data, error } = await supabase
                .from(CATEGORIES_TABLE)
                .update(categoryData)
                .eq('id', currentEditingId)
                .select();
            
            if (error) throw error;
            return data[0];
        } else {
            // Create new category
            const { data, error } = await supabase
                .from(CATEGORIES_TABLE)
                .insert([categoryData])
                .select();
            
            if (error) throw error;
            return data[0];
        }
    } catch (error) {
        console.error('Error saving category:', error);
        showMessage('خطا در ذخیره‌سازی دسته‌بندی', 'error');
        throw error;
    }
}

async function saveProduct(productData) {
    try {
        const supabase = getSupabase();
        
        if (currentEditingId) {
            // Update existing product
            const { data, error } = await supabase
                .from(PRODUCTS_TABLE)
                .update(productData)
                .eq('id', currentEditingId)
                .select();
            
            if (error) throw error;
            return data[0];
        } else {
            // Create new product
            const { data, error } = await supabase
                .from(PRODUCTS_TABLE)
                .insert([productData])
                .select();
            
            if (error) throw error;
            return data[0];
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showMessage('خطا در ذخیره‌سازی محصول', 'error');
        throw error;
    }
}

async function deleteCategory(categoryId) {
    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from(CATEGORIES_TABLE)
            .delete()
            .eq('id', categoryId);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        showMessage('خطا در حذف دسته‌بندی', 'error');
        throw error;
    }
}

async function deleteProduct(productId) {
    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from(PRODUCTS_TABLE)
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('خطا در حذف محصول', 'error');
        throw error;
    }
}

// Image Upload to Supabase Storage
async function uploadImage(file) {
    try {
        const supabase = getSupabase();
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;
        
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        showMessage('خطا در آپلود عکس', 'error');
        throw error;
    }
}

// Real-time Subscriptions
function setupRealtimeSubscriptions() {
    try {
        const supabase = getSupabase();
        
        // Categories subscription
        categoriesSubscription = supabase
            .channel('categories_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: CATEGORIES_TABLE },
                (payload) => {
                    console.log('Categories changed:', payload);
                    loadCategories().then(() => {
                        renderCategories();
                        renderAdminCategories();
                    });
                }
            )
            .subscribe();
        
        // Products subscription
        productsSubscription = supabase
            .channel('products_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: PRODUCTS_TABLE },
                (payload) => {
                    console.log('Products changed:', payload);
                    loadProducts().then(() => {
                        renderProducts();
                        renderAdminProducts();
                        renderCategories();
                    });
                }
            )
            .subscribe();
        
        console.log('Real-time subscriptions set up successfully');
    } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
        showMessage('خطا در راه‌اندازی به‌روزرسانی‌های زنده', 'error');
    }
}

// Cleanup subscriptions
function cleanupSubscriptions() {
    if (categoriesSubscription) {
        categoriesSubscription.unsubscribe();
        categoriesSubscription = null;
    }
    if (productsSubscription) {
        productsSubscription.unsubscribe();
        productsSubscription = null;
    }
}

// Real-time updates
function enableRealTimeUpdates() {
    // Listen for storage changes (when data is updated in another tab/window)
    window.addEventListener('storage', function(e) {
        if (e.key === 'cafeCategories' || e.key === 'cafeProducts') {
            loadData();
            renderCategories();
            renderProducts();
        }
    });
    
    // Poll for changes every 2 seconds (for same-tab updates)
    setInterval(() => {
        const savedCategories = localStorage.getItem('cafeCategories');
        const savedProducts = localStorage.getItem('cafeProducts');
        
        if (savedCategories && JSON.stringify(categories) !== savedCategories) {
            loadData();
            renderCategories();
            renderProducts();
        }
        
        if (savedProducts && JSON.stringify(products) !== savedProducts) {
            loadData();
            renderCategories();
            renderProducts();
        }
    }, 2000);
}

// DOM Elements
const adminBtn = document.getElementById('adminBtn');
const loginModal = document.getElementById('loginModal');
const adminModal = document.getElementById('adminModal');
const categoryModal = document.getElementById('categoryModal');
const productModal = document.getElementById('productModal');
const productsGrid = document.getElementById('productsGrid');
const categoryButtons = document.getElementById('categoryButtons');
const categoriesList = document.getElementById('categoriesList');
const productsList = document.getElementById('productsList');

// Initialize App
document.addEventListener('DOMContentLoaded', async function() {
    console.log('App initializing...');
    
    // Check if localStorage is available
    if (typeof(Storage) === 'undefined') {
        alert('مرورگر شما از localStorage پشتیبانی نمی‌کند!');
        return;
    }
    
    try {
        // Load data from Supabase
        await loadData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Render initial data
        renderCategories();
        renderProducts();
        
        // Setup real-time subscriptions
        setupRealtimeSubscriptions();
        
        console.log('App initialized successfully');
        console.log('Categories:', categories);
        console.log('Products:', products);
    } catch (error) {
        console.error('Error initializing app:', error);
        showMessage('خطا در راه‌اندازی برنامه: ' + error.message, 'error');
        
        // Fallback to localStorage
        loadDataFromLocalStorage();
        renderCategories();
        renderProducts();
    }
});

// Event Listeners
function setupEventListeners() {
    // Admin button
    adminBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
    });

    // Modal close buttons
    document.getElementById('closeLoginModal').addEventListener('click', () => {
        loginModal.classList.remove('active');
    });

    document.getElementById('closeAdminModal').addEventListener('click', () => {
        adminModal.classList.remove('active');
    });

    document.getElementById('closeCategoryModal').addEventListener('click', () => {
        categoryModal.classList.remove('active');
    });

    document.getElementById('closeProductModal').addEventListener('click', () => {
        productModal.classList.remove('active');
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Admin tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Add buttons
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
        openCategoryModal();
    });

    document.getElementById('addProductBtn').addEventListener('click', () => {
        openProductModal();
    });

    // Cancel buttons
    document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
        categoryModal.classList.remove('active');
    });

    document.getElementById('cancelProductBtn').addEventListener('click', () => {
        productModal.classList.remove('active');
    });

    // Forms
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);

    // Image preview
    document.getElementById('productImage').addEventListener('change', handleImagePreview);

    // Category filter
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            filterProducts(e.target.dataset.category);
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
        }
    });

    // Close modals on outside click
    [loginModal, adminModal, categoryModal, productModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Data Management
async function loadData() {
    console.log('Loading data from Supabase...');
    
    try {
        // Load categories and products from Supabase
        await Promise.all([
            loadCategories(),
            loadProducts()
        ]);
        
        console.log('Data loaded successfully');
        console.log('Categories:', categories);
        console.log('Products:', products);
        
        // If no data exists, create default data
        if (categories.length === 0) {
            await createDefaultCategories();
        }
        
        if (products.length === 0) {
            await createDefaultProducts();
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('خطا در بارگذاری داده‌ها: ' + error.message, 'error');
        
        // Fallback to localStorage if Supabase fails
        loadDataFromLocalStorage();
    }
}

// Fallback to localStorage
function loadDataFromLocalStorage() {
    console.log('Falling back to localStorage...');
    
    try {
        const savedCategories = localStorage.getItem('cafeCategories');
        const savedProducts = localStorage.getItem('cafeProducts');

        if (savedCategories) {
            categories = JSON.parse(savedCategories);
        } else {
            categories = [
                { id: 1, name: 'نوشیدنی‌های گرم' },
                { id: 2, name: 'نوشیدنی‌های سرد' },
                { id: 3, name: 'دسرها' },
                { id: 4, name: 'غذاهای سبک' }
            ];
        }

        if (savedProducts) {
            products = JSON.parse(savedProducts);
        } else {
            products = [
                {
                    id: 1,
                    name: 'اسپرسو',
                    categoryId: 1,
                    price: 15000,
                    description: 'قهوه اسپرسو خالص و قوی',
                    image: null
                },
                {
                    id: 2,
                    name: 'کاپوچینو',
                    categoryId: 1,
                    price: 18000,
                    description: 'اسپرسو با شیر بخارپز و فوم',
                    image: null
                },
                {
                    id: 3,
                    name: 'لاته',
                    categoryId: 1,
                    price: 20000,
                    description: 'اسپرسو با شیر داغ و فوم نرم',
                    image: null
                },
                {
                    id: 4,
                    name: 'آیس کافی',
                    categoryId: 2,
                    price: 22000,
                    description: 'قهوه سرد با یخ و شیر',
                    image: null
                },
                {
                    id: 5,
                    name: 'چیزکیک',
                    categoryId: 3,
                    price: 25000,
                    description: 'چیزکیک خانگی با توت فرنگی',
                    image: null
                }
            ];
        }
        
        console.log('Data loaded from localStorage');
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        showMessage('خطا در بارگذاری داده‌ها', 'error');
    }
}

// Create default categories in Supabase
async function createDefaultCategories() {
    const defaultCategories = [
        { name: 'نوشیدنی‌های گرم' },
        { name: 'نوشیدنی‌های سرد' },
        { name: 'دسرها' },
        { name: 'غذاهای سبک' }
    ];
    
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(CATEGORIES_TABLE)
            .insert(defaultCategories)
            .select();
        
        if (error) throw error;
        
        categories = data;
        console.log('Default categories created:', categories);
    } catch (error) {
        console.error('Error creating default categories:', error);
    }
}

// Create default products in Supabase
async function createDefaultProducts() {
    const defaultProducts = [
        {
            name: 'اسپرسو',
            category_id: categories[0]?.id,
            price: 15000,
            description: 'قهوه اسپرسو خالص و قوی',
            image_url: null
        },
        {
            name: 'کاپوچینو',
            category_id: categories[0]?.id,
            price: 18000,
            description: 'اسپرسو با شیر بخارپز و فوم',
            image_url: null
        },
        {
            name: 'لاته',
            category_id: categories[0]?.id,
            price: 20000,
            description: 'اسپرسو با شیر داغ و فوم نرم',
            image_url: null
        },
        {
            name: 'آیس کافی',
            category_id: categories[1]?.id,
            price: 22000,
            description: 'قهوه سرد با یخ و شیر',
            image_url: null
        },
        {
            name: 'چیزکیک',
            category_id: categories[2]?.id,
            price: 25000,
            description: 'چیزکیک خانگی با توت فرنگی',
            image_url: null
        }
    ];
    
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(PRODUCTS_TABLE)
            .insert(defaultProducts)
            .select();
        
        if (error) throw error;
        
        products = data;
        console.log('Default products created:', products);
    } catch (error) {
        console.error('Error creating default products:', error);
    }
}

// Save data to localStorage as backup
function saveDataToLocalStorage() {
    try {
        localStorage.setItem('cafeCategories', JSON.stringify(categories));
        localStorage.setItem('cafeProducts', JSON.stringify(products));
        console.log('Data saved to localStorage as backup');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    if (password === ADMIN_PASSWORD) {
        loginModal.classList.remove('active');
        adminModal.classList.add('active');
        document.getElementById('password').value = '';
        showMessage('ورود موفقیت‌آمیز بود', 'success');
    } else {
        showMessage('رمز عبور اشتباه است! لطفاً رمز صحیح را وارد کنید.', 'error');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// Category Management
function openCategoryModal(categoryId = null) {
    currentEditingId = categoryId;
    const form = document.getElementById('categoryForm');
    const title = document.getElementById('categoryModalTitle');
    
    if (categoryId) {
        const category = categories.find(c => c.id === categoryId);
        document.getElementById('categoryName').value = category.name;
        title.textContent = 'ویرایش دسته‌بندی';
    } else {
        form.reset();
        title.textContent = 'افزودن دسته‌بندی';
    }
    
    categoryModal.classList.add('active');
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('categoryName').value.trim();
    
    if (!name) {
        showMessage('لطفاً نام دسته‌بندی را وارد کنید', 'error');
        return;
    }
    
    try {
        const categoryData = { name };
        
        if (currentEditingId) {
            // Edit existing category
            await saveCategory(categoryData);
            showMessage('دسته‌بندی با موفقیت ویرایش شد', 'success');
        } else {
            // Add new category
            await saveCategory(categoryData);
            showMessage('دسته‌بندی با موفقیت اضافه شد', 'success');
        }
        
        // Save to localStorage as backup
        saveDataToLocalStorage();
        
        categoryModal.classList.remove('active');
        currentEditingId = null;
        
        console.log('Category saved successfully');
    } catch (error) {
        console.error('Error saving category:', error);
        showMessage('خطا در ذخیره‌سازی دسته‌بندی', 'error');
    }
}

async function handleDeleteCategory(categoryId) {
    if (confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
        try {
            // Check if category has products
            const hasProducts = products.some(p => p.category_id === categoryId);
            if (hasProducts) {
                showMessage('نمی‌توان دسته‌بندی دارای محصول را حذف کرد', 'error');
                return;
            }
            
            await deleteCategory(categoryId);
            
            // Save to localStorage as backup
            saveDataToLocalStorage();
            
            showMessage('دسته‌بندی با موفقیت حذف شد', 'success');
        } catch (error) {
            console.error('Error deleting category:', error);
            showMessage('خطا در حذف دسته‌بندی', 'error');
        }
    }
}

// Product Management
function openProductModal(productId = null) {
    currentEditingId = productId;
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    
    // Populate category select
    const categorySelect = document.getElementById('productCategory');
    categorySelect.innerHTML = '<option value="">انتخاب دسته‌بندی</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
    
    if (productId) {
        const product = products.find(p => p.id === productId);
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.categoryId;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDescription').value = product.description || '';
        title.textContent = 'ویرایش محصول';
        
        // Show existing image if available
        const imagePreview = document.getElementById('imagePreview');
        if (product.image) {
            imagePreview.innerHTML = `<img src="${product.image}" alt="تصویر محصول">`;
        } else {
            imagePreview.innerHTML = '';
        }
    } else {
        form.reset();
        document.getElementById('imagePreview').innerHTML = '';
        title.textContent = 'افزودن محصول';
    }
    
    productModal.classList.add('active');
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const categoryId = parseInt(document.getElementById('productCategory').value);
    const price = parseInt(document.getElementById('productPrice').value);
    const description = document.getElementById('productDescription').value.trim();
    const imageFile = document.getElementById('productImage').files[0];
    
    // Validation
    if (!name) {
        showMessage('لطفاً نام محصول را وارد کنید', 'error');
        return;
    }
    
    if (!categoryId) {
        showMessage('لطفاً دسته‌بندی را انتخاب کنید', 'error');
        return;
    }
    
    if (!price || price <= 0) {
        showMessage('لطفاً قیمت معتبر وارد کنید', 'error');
        return;
    }
    
    try {
        let imageUrl = null;
        
        // Upload image if provided
        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }
        
        const productData = {
            name,
            category_id: categoryId,
            price,
            description,
            image_url: imageUrl
        };
        
        if (currentEditingId) {
            // Edit existing product
            await saveProduct(productData);
            showMessage('محصول با موفقیت ویرایش شد', 'success');
        } else {
            // Add new product
            await saveProduct(productData);
            showMessage('محصول با موفقیت اضافه شد', 'success');
        }
        
        // Save to localStorage as backup
        saveDataToLocalStorage();
        
        productModal.classList.remove('active');
        currentEditingId = null;
        
        console.log('Product saved successfully');
    } catch (error) {
        console.error('Error saving product:', error);
        showMessage('خطا در ذخیره‌سازی محصول', 'error');
    }
}

async function handleDeleteProduct(productId) {
    if (confirm('آیا از حذف این محصول اطمینان دارید؟')) {
        try {
            await deleteProduct(productId);
            
            // Save to localStorage as backup
            saveDataToLocalStorage();
            
            showMessage('محصول با موفقیت حذف شد', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showMessage('خطا در حذف محصول', 'error');
        }
    }
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="پیش‌نمایش تصویر">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Rendering Functions
function renderCategories() {
    // Render category filter buttons
    categoryButtons.innerHTML = '';
    
    // Add "All" button first
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.textContent = 'همه';
    allButton.dataset.category = 'all';
    categoryButtons.appendChild(allButton);
    
    // Add category buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category.name;
        button.dataset.category = category.id;
        categoryButtons.appendChild(button);
    });
}

function renderAdminCategories() {
    // Render admin categories list
    categoriesList.innerHTML = '';
    categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'item-card';
        item.innerHTML = `
            <div class="item-info">
                <h4>${category.name}</h4>
                <p>${products.filter(p => p.categoryId === category.id).length} محصول</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-sm btn-edit" onclick="openCategoryModal(${category.id})">
                    <i class="fas fa-edit"></i>
                    ویرایش
                </button>
                <button class="btn btn-sm btn-delete" onclick="handleDeleteCategory(${category.id})">
                    <i class="fas fa-trash"></i>
                    حذف
                </button>
            </div>
        `;
        categoriesList.appendChild(item);
    });
}

function renderProducts(filterCategoryId = null) {
    productsGrid.innerHTML = '';
    
    let filteredProducts = products;
    if (filterCategoryId && filterCategoryId !== 'all') {
        filteredProducts = products.filter(p => (p.category_id || p.categoryId) === parseInt(filterCategoryId));
    }
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-coffee"></i>
                <h3>محصولی یافت نشد</h3>
                <p>در این دسته‌بندی محصولی وجود ندارد</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const category = categories.find(c => c.id === (product.category_id || product.categoryId));
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const imageSrc = product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGMEU4Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE1MCA4OS41IDE1OC41IDgxIDE2OSA4MUgxMzFDMTQxLjUgODEgMTUwIDg5LjUgMTUwIDEwMFoiIGZpbGw9IiM0QTdDNTkiLz4KPHBhdGggZD0iTTE1MCAxMDBDMTUwIDExMC41IDE0MS41IDExOSAxMzEgMTE5SDE2OUMxNTguNSAxMTkgMTUwIDExMC41IDE1MCAxMDBaIiBmaWxsPSIjMkQ1QTI3Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkM3NTdEIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPuaXoOaXoOaXoOaXoDwvdGV4dD4KPC9zdmc+';
        
        const descriptionHtml = product.description ? `<p class="product-description">${product.description}</p>` : '';
        
        card.innerHTML = `
            <img src="${imageSrc}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                ${descriptionHtml}
                <div class="product-price">
                    <i class="fas fa-tag"></i>
                    ${product.price.toLocaleString('fa-IR')} تومان
                </div>
            </div>
        `;
        
        productsGrid.appendChild(card);
    });
}

function renderAdminProducts() {
    productsList.innerHTML = '';
    
    products.forEach(product => {
        const category = categories.find(c => c.id === (product.category_id || product.categoryId));
        const item = document.createElement('div');
        item.className = 'item-card';
        
        const imagePreview = product.image ? 
            `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-left: 1rem;">` : 
            '<div style="width: 50px; height: 50px; background: #e9ecef; border-radius: 8px; margin-left: 1rem; display: flex; align-items: center; justify-content: center;"><i class="fas fa-image" style="color: #6c757d;"></i></div>';
        
        item.innerHTML = `
            <div class="item-info" style="display: flex; align-items: center;">
                ${imagePreview}
                <div>
                    <h4>${product.name}</h4>
                    <p>${category ? category.name : 'بدون دسته‌بندی'} - ${product.price.toLocaleString('fa-IR')} تومان</p>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-sm btn-edit" onclick="openProductModal(${product.id})">
                    <i class="fas fa-edit"></i>
                    ویرایش
                </button>
                <button class="btn btn-sm btn-delete" onclick="handleDeleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                    حذف
                </button>
            </div>
        `;
        productsList.appendChild(item);
    });
}

// Utility Functions
function filterProducts(categoryId) {
    renderProducts(categoryId);
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Render appropriate content
    if (tabName === 'products') {
        renderAdminProducts();
    } else if (tabName === 'categories') {
        renderAdminCategories();
    }
}

function showMessage(text, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${text}
    `;
    
    // Try to insert message in admin panel if it's open, otherwise show alert
    const adminPanel = document.querySelector('.admin-panel .modal-content');
    if (adminPanel) {
        adminPanel.insertBefore(message, adminPanel.firstChild);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    } else {
        // If admin panel is not open, show alert
        alert(text);
    }
    
    console.log(`Message: ${text} (${type})`);
}

// Initialize category filter
document.addEventListener('DOMContentLoaded', function() {
    // Set initial active category
    const allCategoryBtn = document.querySelector('[data-category="all"]');
    if (allCategoryBtn) {
        allCategoryBtn.classList.add('active');
    }
});
