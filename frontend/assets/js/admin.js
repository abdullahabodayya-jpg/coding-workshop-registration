const API_BASE =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api";

const DASHBOARD_API = `${API_BASE}/admin/dashboard.php`;

const chartInstances = {};

const chartColors = {
    coffee: "#80604A",
    coffeeDark: "#5E4535",
    sage: "#8DAA91",
    sageDark: "#607F68",
    lavender: "#B9A7CC",
    lavenderLight: "#DDD3E7",
    rose: "#C98F91",
    platinum: "#E5E4E2",
    cream: "#F4EFE8",
    muted: "#77736F",
    border: "#E9E3DC",
    white: "#FFFFFF",
    text: "#292B33"
};

const palette = [
    chartColors.coffee,
    chartColors.sage,
    chartColors.lavender,
    chartColors.rose,
    chartColors.sageDark,
    chartColors.platinum,
    chartColors.coffeeDark,
    chartColors.lavenderLight
];

const numberFormatter = new Intl.NumberFormat();

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = numberFormatter.format(
            Number(value) || 0
        );
    }
}

function showDashboardMessage(message = "", isError = false) {
    const element = document.getElementById("dashboardMessage");

    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error", isError);
}

function chartOptions({ legendPosition = "bottom" } = {}) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 650
        },
        plugins: {
            legend: {
                position: legendPosition,
                labels: {
                    color: chartColors.muted,
                    usePointStyle: true,
                    pointStyle: "circle",
                    boxWidth: 8,
                    boxHeight: 8,
                    padding: 18,
                    font: {
                        family: "DM Sans",
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: chartColors.coffeeDark,
                titleColor: chartColors.white,
                bodyColor: chartColors.white,
                padding: 12,
                cornerRadius: 10,
                displayColors: true
            }
        }
    };
}

function renderChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        console.warn(`Canvas not found: ${canvasId}`);
        return;
    }

    if (typeof Chart === "undefined") {
        throw new Error("Chart.js could not be loaded.");
    }

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(canvas, config);
}

function renderGenderChart(gender = {}) {
    const male = Number(gender.male) || 0;
    const female = Number(gender.female) || 0;

    renderChart("genderChart", {
        type: "doughnut",
        data: {
            labels: ["Male", "Female"],
            datasets: [{
                data: [male, female],
                backgroundColor: [
                    chartColors.sage,
                    chartColors.lavender
                ],
                borderColor: chartColors.white,
                borderWidth: 5,
                hoverOffset: 8,
                spacing: 3
            }]
        },
        options: {
            ...chartOptions(),
            cutout: "72%"
        }
    });
}

function renderWorkshopStatusChart(statuses = {}) {
    const keys = [
        "draft",
        "published",
        "completed",
        "cancelled"
    ];

    const labels = [
        "Draft",
        "Published",
        "Completed",
        "Cancelled"
    ];

    renderChart("workshopStatusChart", {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: keys.map(
                    key => Number(statuses[key]) || 0
                ),
                backgroundColor: [
                    chartColors.platinum,
                    chartColors.sage,
                    chartColors.coffee,
                    chartColors.rose
                ],
                borderColor: chartColors.white,
                borderWidth: 4,
                hoverOffset: 7,
                spacing: 3
            }]
        },
        options: {
            ...chartOptions(),
            cutout: "58%"
        }
    });
}

function renderMonthlyRegistrations(months = []) {
    const orderedMonths = [...months];

    renderChart("monthlyRegistrationsChart", {
        type: "line",
        data: {
            labels: orderedMonths.map(item => item.month),
            datasets: [{
                label: "Registrations",
                data: orderedMonths.map(
                    item => Number(item.total) || 0
                ),
                borderColor: chartColors.sageDark,
                backgroundColor: "rgba(141, 170, 145, 0.20)",
                fill: true,
                tension: 0.38,
                borderWidth: 3,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: chartColors.sageDark,
                pointBorderColor: chartColors.white,
                pointBorderWidth: 2
            }]
        },
        options: {
            ...chartOptions(),
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: chartColors.muted,
                        maxRotation: 0
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: chartColors.muted
                    },
                    grid: {
                        color: "rgba(128, 96, 74, 0.10)"
                    },
                    border: {
                        display: false,
                        dash: [4, 4]
                    }
                }
            }
        }
    });
}

function renderWorkshopRegistrations(workshops = []) {
    const sorted = [...workshops]
        .sort((a, b) => Number(b.total) - Number(a.total))
        .slice(0, 8);

    renderChart("workshopRegistrationsChart", {
        type: "bar",
        data: {
            labels: sorted.map(item => item.title),
            datasets: [{
                label: "Confirmed registrations",
                data: sorted.map(
                    item => Number(item.total) || 0
                ),
                backgroundColor: sorted.map(
                    (_, index) => palette[index % palette.length]
                ),
                borderRadius: 7,
                borderSkipped: false,
                maxBarThickness: 24,
                barPercentage: 0.75,
                categoryPercentage: 0.8
            }]
        },
        options: {
            ...chartOptions(),
            indexAxis: "y",
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: chartColors.muted
                    },
                    grid: {
                        color: "rgba(128, 96, 74, 0.10)"
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    ticks: {
                        color: chartColors.muted
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            },
            plugins: {
                ...chartOptions().plugins,
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateStatistics(data) {
    const stats = data.stats || {};

    setText("totalUsers", stats.total_users);
    setText("totalWorkshops", stats.total_workshops);
    setText("totalRegistrations", stats.total_registrations);
    setText("totalInstructors", stats.total_instructors);
    setText("openMessages", stats.open_messages);
    setText("pendingMessages", stats.pending_messages);

    renderGenderChart(data.gender || {});
    renderWorkshopStatusChart(data.workshop_statuses || {});
    renderMonthlyRegistrations(data.monthly_registrations || []);
    renderWorkshopRegistrations(data.registrations_by_workshop || []);
}

async function loadDashboard() {
    const refreshButton =
        document.getElementById("refreshDashboard");

    if (refreshButton) {
        refreshButton.disabled = true;
    }

    showDashboardMessage("Loading dashboard data...");

    try {
        const response = await fetch(DASHBOARD_API, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json"
            }
        });

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error(
                "The server returned an invalid response."
            );
        }

        if (response.status === 401 || response.status === 403) {
            throw new Error(
                "Your admin session is invalid. Please log in again."
            );
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Failed to load dashboard statistics."
            );
        }

        updateStatistics(result.data);

        showDashboardMessage("Dashboard data updated successfully.");
    } catch (error) {
        console.error("Dashboard error:", error);

        showDashboardMessage(
            error.message || "Unable to load dashboard data.",
            true
        );
    } finally {
        if (refreshButton) {
            refreshButton.disabled = false;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("refreshDashboard")
        ?.addEventListener("click", loadDashboard);

    if (typeof Chart === "undefined") {
        showDashboardMessage(
            "Chart.js failed to load. Check your internet connection.",
            true
        );
        return;
    }

    loadDashboard();
});
