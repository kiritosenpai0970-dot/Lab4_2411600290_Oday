
/* =========================================
   Student Grade Portal
   Lab 4: Chart.js Visualizations
========================================= */

let categoryValueChart = null;
let stockStatusChart = null;
let topProductsChart = null;

const chartColors = {
    primary: "#0d5c3e",
    secondary: "#1a936f",
    accent: "#f3a712",
    danger: "#dc3545",
    light: "#d4ece4",
    text: "#1a2e24"
};

function formatPeso(value) {
    return "₱" + Number(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Shared chart settings for readability and responsiveness
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    animation: {
        duration: 500
    },
    interaction: {
        intersect: false,
        mode: "index"
    },
    plugins: {
        legend: {
            labels: {
                color: chartColors.text,
                font: {
                    size: 12
                },
                padding: 16
            }
        },
        tooltip: {
            enabled: true,
            titleFont: {
                size: 13
            },
            bodyFont: {
                size: 12
            },
            padding: 10,
            callbacks: {
                label: context => {
                    const value = context.raw;
                    return typeof value === "number"
                        ? " " + formatPeso(value)
                        : " " + value;
                }
            }
        }
    }
};

// Create all charts after inventory data loads
function initializeCharts() {
    if (typeof Chart === "undefined") {
        console.error("Chart.js could not be loaded.");
        return;
    }

    // Prevent duplicate charts
    [categoryValueChart, stockStatusChart, topProductsChart]
        .forEach(chart => {
            if (chart) chart.destroy();
        });

    categoryValueChart = null;
    stockStatusChart = null;
    topProductsChart = null;

    createCategoryValueChart();
    createStockStatusChart();
    createTopProductsChart();
}

// Chart 1: Inventory value by category
function createCategoryValueChart() {
    const canvas = document.getElementById("categoryValueChart");
    if (!canvas) return;

    const categories = getCategorySummary();

    categoryValueChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: categories.map(item => item.category),
            datasets: [{
                label: "Inventory Value (₱)",
                data: categories.map(item => item.totalValue),
                backgroundColor: chartColors.secondary,
                borderColor: chartColors.primary,
                borderWidth: 1,
                borderRadius: 5,
                maxBarThickness: 55
            }]
        },
        options: {
            ...commonChartOptions,
            scales: {
                x: {
                    ticks: {
                        color: chartColors.text,
                        font: { size: 12 },
                        maxRotation: 0
                    },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: chartColors.text,
                        font: { size: 11 },
                        callback: value =>
                            "₱" + Number(value).toLocaleString("en-PH")
                    }
                }
            }
        }
    });
}

// Chart 2: Stock status distribution
function createStockStatusChart() {
    const canvas = document.getElementById("stockStatusChart");
    if (!canvas) return;

    const allProducts = getProducts();

    const counts = [
        allProducts.filter(p => getStockStatus(p) === "in-stock").length,
        allProducts.filter(p => getStockStatus(p) === "low-stock").length,
        allProducts.filter(p => getStockStatus(p) === "out-of-stock").length
    ];

    stockStatusChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["In Stock", "Low Stock", "Out of Stock"],
            datasets: [{
                data: counts,
                backgroundColor: [
                    chartColors.secondary,
                    chartColors.accent,
                    chartColors.danger
                ],
                borderColor: "#ffffff",
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            ...commonChartOptions,
            cutout: "60%",
            plugins: {
                ...commonChartOptions.plugins,
                legend: {
                    position: "bottom",
                    labels: {
                        color: chartColors.text,
                        padding: 16,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Chart 3: Top five products by inventory value
function createTopProductsChart() {
    const canvas = document.getElementById("topProductsChart");
    if (!canvas) return;

    const topProducts = getProducts()
        .sort((a, b) =>
            (b.quantity * b.unit_price) -
            (a.quantity * a.unit_price)
        )
        .slice(0, 5);

    topProductsChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: topProducts.map(product => product.name),
            datasets: [{
                label: "Inventory Value (₱)",
                data: topProducts.map(
                    product => product.quantity * product.unit_price
                ),
                backgroundColor: chartColors.primary,
                borderColor: chartColors.secondary,
                borderWidth: 1,
                borderRadius: 5,
                maxBarThickness: 38
            }]
        },
        options: {
            ...commonChartOptions,
            indexAxis: "y",
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: chartColors.text,
                        font: { size: 11 },
                        callback: value =>
                            "₱" + Number(value).toLocaleString("en-PH")
                    }
                },
                y: {
                    ticks: {
                        color: chartColors.text,
                        font: { size: 12 }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

// Refresh chart data after stock changes
function updateCharts() {
    if (categoryValueChart) {
        const categories = getCategorySummary();

        categoryValueChart.data.labels =
            categories.map(item => item.category);

        categoryValueChart.data.datasets[0].data =
            categories.map(item => item.totalValue);

        categoryValueChart.update();
    }

    if (stockStatusChart) {
        const allProducts = getProducts();

        stockStatusChart.data.datasets[0].data = [
            allProducts.filter(p => getStockStatus(p) === "in-stock").length,
            allProducts.filter(p => getStockStatus(p) === "low-stock").length,
            allProducts.filter(p => getStockStatus(p) === "out-of-stock").length
        ];

        stockStatusChart.update();
    }

    if (topProductsChart) {
        const topProducts = getProducts()
            .sort((a, b) =>
                (b.quantity * b.unit_price) -
                (a.quantity * a.unit_price)
            )
            .slice(0, 5);

        topProductsChart.data.labels =
            topProducts.map(product => product.name);

        topProductsChart.data.datasets[0].data =
            topProducts.map(
                product => product.quantity * product.unit_price
            );

        topProductsChart.update();
    }
}
