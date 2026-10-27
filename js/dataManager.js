
/* =========================================
   Student Grade Portal
   Lab 4: Inventory Data Management
   Connected to PHP API
========================================= */

const API_URL = "api_products.php";
const ADD_API_URL = "api_add_product.php";
const UPDATE_STOCK_API_URL = "api_update_stock.php";

let products = [];
let inventoryChanges = [];

// Load inventory from PHP API
async function initializeData() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.products)) {
            throw new Error("Invalid inventory data received.");
        }

        products = data.products.map(product => ({
            ...product,
            id: Number(product.id),
            category: normalizeCategory(product.category),
            quantity: Number(product.quantity),
            reorder_level: Number(product.reorder_level),
            unit_price: Number(product.unit_price),
            supplier: product.supplier || "Not specified"
        }));

        inventoryChanges = [];

        console.log("Inventory loaded from PHP API.");

        return getProducts();
    } catch (error) {
        console.error("Unable to load inventory:", error);
        throw error;
    }
}

// Keep category names consistent
function normalizeCategory(category) {
    const categories = {
        "Paper": "Paper Supplies",
        "Writing": "Writing Tools"
    };

    return categories[category] || category;
}

// Return all products
function getProducts() {
    return products.map(product => ({ ...product }));
}

// Return one product by ID
function getProductById(id) {
    const product = products.find(item => item.id === Number(id));
    return product ? { ...product } : null;
}

// Return products in a category
function getProductsByCategory(category) {
    if (!category || category === "all") {
        return getProducts();
    }

    return products
        .filter(product => product.category === category)
        .map(product => ({ ...product }));
}

// Determine stock status
function getStockStatus(product) {
    if (product.quantity <= 0) {
        return "out-of-stock";
    }

    if (product.quantity <= product.reorder_level) {
        return "low-stock";
    }

    return "in-stock";
}

// Return low-stock products
function getLowStockProducts() {
    return products
        .filter(product =>
            product.quantity > 0 &&
            product.quantity <= product.reorder_level
        )
        .map(product => ({ ...product }));
}

// Return out-of-stock products
function getOutOfStockProducts() {
    return products
        .filter(product => product.quantity <= 0)
        .map(product => ({ ...product }));
}

// Inventory statistics
function getStockStatistics() {
    return {
        totalProducts: products.length,
        totalValue: products.reduce(
            (total, product) =>
                total + product.quantity * product.unit_price,
            0
        ),
        lowStockCount: getLowStockProducts().length,
        outOfStockCount: getOutOfStockProducts().length,
        totalQuantity: products.reduce(
            (total, product) => total + product.quantity,
            0
        )
    };
}

// Summarize inventory by category
function getCategorySummary() {
    const summary = {};

    products.forEach(product => {
        if (!summary[product.category]) {
            summary[product.category] = {
                category: product.category,
                totalQuantity: 0,
                totalValue: 0,
                productCount: 0
            };
        }

        summary[product.category].totalQuantity += product.quantity;
        summary[product.category].totalValue +=
            product.quantity * product.unit_price;
        summary[product.category].productCount++;
    });

    return Object.values(summary);
}

// Filter by category
function filterByCategory(category) {
    return getProductsByCategory(category);
}

// Filter by stock status
function filterByStockStatus(status) {
    if (!status || status === "all") {
        return getProducts();
    }

    return products
        .filter(product => getStockStatus(product) === status)
        .map(product => ({ ...product }));
}

// Filter by price range
function filterByPriceRange(min, max) {
    const minimum = min === "" || min == null ? 0 : Number(min);
    const maximum = max === "" || max == null ? Infinity : Number(max);

    return products
        .filter(product =>
            product.unit_price >= minimum &&
            product.unit_price <= maximum
        )
        .map(product => ({ ...product }));
}

// Search by name or SKU
function searchProducts(query) {
    const searchTerm = String(query || "").trim().toLowerCase();

    if (!searchTerm) {
        return getProducts();
    }

    return products
        .filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm)
        )
        .map(product => ({ ...product }));
}

// Apply filters together
function applyFilters(filters = {}) {
    const category = filters.category || "all";
    const status = filters.status || "all";
    const query = String(filters.query || "").trim().toLowerCase();
    const min = filters.minPrice ?? "";
    const max = filters.maxPrice ?? "";

    const minimum = min === "" ? 0 : Number(min);
    const maximum = max === "" ? Infinity : Number(max);

    return products
        .filter(product => {
            const matchesCategory =
                category === "all" || product.category === category;

            const matchesStatus =
                status === "all" || getStockStatus(product) === status;

            const matchesPrice =
                product.unit_price >= minimum &&
                product.unit_price <= maximum;

            const matchesSearch =
                !query ||
                product.name.toLowerCase().includes(query) ||
                product.sku.toLowerCase().includes(query);

            return matchesCategory &&
                matchesStatus &&
                matchesPrice &&
                matchesSearch;
        })
        .map(product => ({ ...product }));
}

// Add a product through the PHP API
async function addProduct(productData) {
    const response = await fetch(ADD_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(productData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to add product.");
    }

    const newProduct = {
        ...result.product,
        id: Number(result.product.id),
        category: normalizeCategory(result.product.category),
        quantity: Number(result.product.quantity),
        reorder_level: Number(result.product.reorder_level),
        unit_price: Number(result.product.unit_price),
        supplier: result.product.supplier || "Not specified"
    };

    products.push(newProduct);

    return { ...newProduct };
}

// Update stock through the PHP API
async function updateProductStock(id, newQuantity) {
    const product = products.find(item => item.id === Number(id));
    const quantity = Number(newQuantity);

    if (!product || !Number.isInteger(quantity) || quantity < 0) {
        throw new Error("Invalid product or stock quantity.");
    }

    const response = await fetch(UPDATE_STOCK_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: Number(id),
            quantity: quantity
        })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update stock.");
    }

    const previousQuantity = product.quantity;
    product.quantity = quantity;

    inventoryChanges.unshift({
        time: new Date().toLocaleTimeString(),
        product: product.name,
        change: `${previousQuantity} → ${quantity}`
    });

    inventoryChanges = inventoryChanges.slice(0, 10);

    return true;
}

// Return recent stock changes
function getInventoryChanges() {
    return inventoryChanges.map(change => ({ ...change }));
}

// Simulate a stock update and save it through the API
async function simulateInventoryUpdate() {
    if (products.length === 0) {
        return null;
    }

    const product = products[
        Math.floor(Math.random() * products.length)
    ];

    const change = Math.random() < 0.5 ? -1 : 2;
    const newQuantity = Math.max(0, product.quantity + change);

    await updateProductStock(product.id, newQuantity);

    return getProductById(product.id);
}

// Convert inventory to CSV
function exportToCSV(data) {
    const headers = [
        "SKU",
        "Product Name",
        "Category",
        "Quantity",
        "Reorder Level",
        "Unit Price",
        "Inventory Value",
        "Stock Status"
    ];

    const escapeCSV = value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = data.map(product => [
        product.sku,
        product.name,
        product.category,
        product.quantity,
        product.reorder_level,
        Number(product.unit_price).toFixed(2),
        (product.quantity * product.unit_price).toFixed(2),
        getStockStatus(product)
    ]);

    return [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");
}

// Download CSV
function downloadCSV(
    csvContent,
    filename = "school_inventory.csv"
) {
    const blob = new Blob(
        ["\uFEFF", csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}
