
/* =========================================
   Student Grade Portal
   Lab 4: Interactive Dashboard
   Inventory API Integration
========================================= */

document.addEventListener("DOMContentLoaded", async () => {
    // Preserve login protection
    if (localStorage.getItem("isLoggedIn") !== "true") {
        window.location.href = "index.html";
        return;
    }

    updateGreeting();
    updateStudentInfo();
    updateStatistics();
    populateActivityTable();
    setupLogout();
    setupInventoryControls();

    try {
        await initializeData();

        renderInventory();
        initializeCharts();
        renderInventoryChanges();
        updateInventoryAlerts();

    } catch (error) {
        console.error("Unable to load inventory:", error);
        displayInventoryError();
    }
});

// =========================================
// STUDENT DASHBOARD
// =========================================

function updateGreeting() {
    const element = document.getElementById("greeting");
    if (!element) return;

    const hour = new Date().getHours();

    let greeting = "Good evening";

    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 18) {
        greeting = "Good afternoon";
    }

    element.textContent = `${greeting}, Student!`;
}

function updateStudentInfo() {
    const name = document.getElementById("studentName");
    const course = document.getElementById("studentCourse");

    if (name) {
        name.textContent = "Un Hyo Jeremiah M. Oday";
    }

    if (course) {
        course.textContent = "Information Technology";
    }
}

function updateStatistics() {
    const stats = [
        ["stat1-title", "stat1-value", "GPA", "3.50"],
        ["stat2-title", "stat2-value", "Courses", "5 Courses"],
        ["stat3-title", "stat3-value", "Assignments", "1 Pending"],
        ["stat4-title", "stat4-value", "Attendance", "95%"]
    ];

    stats.forEach(([titleId, valueId, title, value]) => {
        const titleElement = document.getElementById(titleId);
        const valueElement = document.getElementById(valueId);

        if (titleElement) titleElement.textContent = title;
        if (valueElement) valueElement.textContent = value;
    });
}

function populateActivityTable() {
    const tableBody = document.getElementById("activityTableBody");
    if (!tableBody) return;

    const activities = [
        ["2026-10-22 14:30", "Lab Exercise 3 submitted - Web Systems and Technologies", "success"],
        ["2026-10-22 13:15", "Quiz graded - Database (88)", "info"],
        ["2026-10-22 11:45", "Assignment due soon - Java Programming", "warning"],
        ["2026-10-21 09:00", "Final Project graded - Web Development (90)", "success"],
        ["2026-10-20 16:20", "Midterm Exam graded - Java Programming (92)", "success"],
        ["2026-10-19 14:10", "Missing requirement flagged - Database Activity 3", "danger"]
    ];

    tableBody.replaceChildren();

    activities.forEach(([date, activity, status]) => {
        const row = document.createElement("tr");

        [date, activity].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = `badge bg-${status}`;

        if (status === "info" || status === "warning") {
            badge.classList.add("text-dark");
        }

        badge.textContent = status;
        statusCell.appendChild(badge);
        row.appendChild(statusCell);
        tableBody.appendChild(row);
    });
}

function setupLogout() {
    const button = document.getElementById("logoutBtn");
    if (!button) return;

    button.addEventListener("click", () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        window.location.href = "index.html";
    });
}

// =========================================
// INVENTORY API ERROR HANDLING
// =========================================

function displayInventoryError(message = "Unable to load inventory data. Please check the PHP API and try again.") {
    const tableBody = document.getElementById("inventoryTableBody");

    if (tableBody) {
        tableBody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 8;
        cell.className = "text-danger text-center";
        cell.textContent = message;

        row.appendChild(cell);
        tableBody.appendChild(row);
    }

    const alertContainer = document.getElementById("inventoryAlert");

    if (alertContainer) {
        alertContainer.replaceChildren();

        const alert = document.createElement("div");
        alert.className = "alert alert-danger";
        alert.textContent = message;

        alertContainer.appendChild(alert);
    }

    setText("inventoryTotalProducts", "—");
    setText("inventoryTotalValue", "—");
    setText("inventoryLowStock", "—");
    setText("inventoryOutOfStock", "—");
    setText("inventoryResultCount", "Inventory unavailable");
}

// =========================================
// INVENTORY CONTROLS
// =========================================

function setupInventoryControls() {
    const search = document.getElementById("productSearch");
    const category = document.getElementById("categoryFilter");
    const status = document.getElementById("stockFilter");
    const minPrice = document.getElementById("minPrice");
    const maxPrice = document.getElementById("maxPrice");
    const sort = document.getElementById("sortFilter");

    [search, category, status, minPrice, maxPrice, sort]
        .forEach(control => {
            if (!control) return;

            control.addEventListener("input", renderInventory);
            control.addEventListener("change", renderInventory);
        });

    const resetButton = document.getElementById("resetFiltersBtn");

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            if (search) search.value = "";
            if (category) category.value = "all";
            if (status) status.value = "all";
            if (minPrice) minPrice.value = "";
            if (maxPrice) maxPrice.value = "";
            if (sort) sort.value = "name-asc";

            renderInventory();
        });
    }

    const exportButton = document.getElementById("exportCsvBtn");

    if (exportButton) {
        exportButton.addEventListener("click", () => {
            const filteredProducts = getFilteredInventory();
            downloadCSV(exportToCSV(filteredProducts));
        });
    }

    const simulateButton = document.getElementById("simulateUpdateBtn");

    if (simulateButton) {
        simulateButton.addEventListener("click", async () => {
            simulateButton.disabled = true;

            try {
                const changedProduct = await simulateInventoryUpdate();

                if (!changedProduct) return;

                renderInventory();
                renderInventoryChanges();
                updateInventoryAlerts();

                if (typeof updateCharts === "function") {
                    updateCharts();
                }

            } catch (error) {
                console.error("Stock update failed:", error);
                displayInventoryError(
                    error.message || "Unable to save the stock update."
                );

            } finally {
                simulateButton.disabled = false;
            }
        });
    }
}

// =========================================
// SEARCH, FILTER, AND SORT
// =========================================

function getFilteredInventory() {
    const search = document.getElementById("productSearch");
    const category = document.getElementById("categoryFilter");
    const status = document.getElementById("stockFilter");
    const minPrice = document.getElementById("minPrice");
    const maxPrice = document.getElementById("maxPrice");
    const sort = document.getElementById("sortFilter");

    const min = minPrice ? minPrice.value : "";
    const max = maxPrice ? maxPrice.value : "";

    if (
        (min !== "" && (!Number.isFinite(Number(min)) || Number(min) < 0)) ||
        (max !== "" && (!Number.isFinite(Number(max)) || Number(max) < 0))
    ) {
        return [];
    }

    if (min !== "" && max !== "" && Number(min) > Number(max)) {
        return [];
    }

    const filtered = applyFilters({
        query: search ? search.value : "",
        category: category ? category.value : "all",
        status: status ? status.value : "all",
        minPrice: min,
        maxPrice: max
    });

    const sortOptions = {
        "name-asc": (a, b) => a.name.localeCompare(b.name),
        "name-desc": (a, b) => b.name.localeCompare(a.name),
        "quantity-asc": (a, b) => a.quantity - b.quantity,
        "quantity-desc": (a, b) => b.quantity - a.quantity,
        "price-asc": (a, b) => a.unit_price - b.unit_price,
        "price-desc": (a, b) => b.unit_price - a.unit_price
    };

    const sortValue = sort ? sort.value : "name-asc";
    const compare = sortOptions[sortValue] || sortOptions["name-asc"];

    return [...filtered].sort(compare);
}

// =========================================
// INVENTORY TABLE
// =========================================

function formatCurrency(value) {
    return "₱" + Number(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function renderInventory() {
    const tableBody = document.getElementById("inventoryTableBody");
    if (!tableBody) return;

    const filteredProducts = getFilteredInventory();
    const stats = getStockStatistics();

    tableBody.replaceChildren();

    if (filteredProducts.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 8;
        cell.textContent = "No products match your filters.";

        row.appendChild(cell);
        tableBody.appendChild(row);
    } else {
        filteredProducts.forEach(product => {
            const row = document.createElement("tr");

            const values = [
                product.sku,
                product.name,
                product.category,
                product.quantity,
                product.reorder_level,
                formatCurrency(product.unit_price),
                formatCurrency(product.quantity * product.unit_price)
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const statusCell = document.createElement("td");
            const badge = document.createElement("span");
            const stockStatus = getStockStatus(product);

            badge.classList.add("badge");

            if (stockStatus === "in-stock") {
                badge.classList.add("bg-success");
                badge.textContent = "In Stock";
            } else if (stockStatus === "low-stock") {
                badge.classList.add("bg-warning", "text-dark");
                badge.textContent = "Low Stock";
            } else {
                badge.classList.add("bg-danger");
                badge.textContent = "Out of Stock";
            }

            statusCell.appendChild(badge);
            row.appendChild(statusCell);
            tableBody.appendChild(row);
        });
    }

    setText("inventoryTotalProducts", stats.totalProducts);
    setText("inventoryTotalValue", formatCurrency(stats.totalValue));
    setText("inventoryLowStock", stats.lowStockCount);
    setText("inventoryOutOfStock", stats.outOfStockCount);

    setText(
        "inventoryResultCount",
        `Showing ${filteredProducts.length} of ${stats.totalProducts} products`
    );

    updateInventoryAlerts();
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

// =========================================
// LOW-STOCK ALERTS
// =========================================

function updateInventoryAlerts() {
    const container = document.getElementById("inventoryAlert");
    if (!container) return;

    container.replaceChildren();

    const lowStock = getLowStockProducts();
    const outOfStock = getOutOfStockProducts();

    if (lowStock.length === 0 && outOfStock.length === 0) {
        const message = document.createElement("div");
        message.className = "alert alert-success";
        message.textContent = "All school supplies have sufficient stock.";
        container.appendChild(message);
        return;
    }

    if (outOfStock.length > 0) {
        const alert = document.createElement("div");
        alert.className = "alert alert-danger";
        alert.textContent =
            `Out of stock (${outOfStock.length}): ` +
            outOfStock.map(product => product.name).join(", ");

        container.appendChild(alert);
    }

    if (lowStock.length > 0) {
        const alert = document.createElement("div");
        alert.className = "alert alert-warning";
        alert.textContent =
            `Low stock (${lowStock.length}): ` +
            lowStock.map(product => product.name).join(", ");

        container.appendChild(alert);
    }
}

// =========================================
// RECENT INVENTORY CHANGES
// =========================================

function renderInventoryChanges() {
    const tableBody = document.getElementById("inventoryChangesBody");
    if (!tableBody) return;

    const changes = getInventoryChanges();
    tableBody.replaceChildren();

    if (changes.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.textContent = "No changes yet.";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    changes.forEach(change => {
        const row = document.createElement("tr");

        [change.time, change.product, change.change].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}
