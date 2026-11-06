/* =========================================
   Student Grade Portal
   Lab 4: Chart.js Visualizations
========================================= */

let gradesByCourseChart = null;
let attendanceChart = null;
let performanceTrendChart = null;

const chartColors = {
    primary: '#0d5c3e',
    secondary: '#1a936f',
    accent: '#f3a712',
    danger: '#dc3545',
    light: '#d4ece4',
    blue: '#4285f4'
};

// =====================================
// INITIALIZE ALL CHARTS
// =====================================

function initializeCharts() {
    updateCharts();
}

function updateCharts() {
    if (
        typeof getStudents !== 'function' ||
        typeof Chart === 'undefined'
    ) {
        return;
    }

    const students = getStudents();

    createGradesByCourseChart(students);
    createAttendanceChart(students);
    createPerformanceTrendChart(students);
}

// =====================================
// CHART 1: AVERAGE GRADES BY COURSE
// HORIZONTAL BAR CHART
// =====================================

function createGradesByCourseChart(students) {
    const canvas = document.getElementById('gradesByCourseChart');

    if (!canvas) return;

    const courseGrades = {};

    students.forEach(student => {
        const courses = Array.isArray(student.courses)
            ? student.courses
            : [];

        courses.forEach(course => {
            const courseName = course.course_name;
            const grade = Number(course.grade);

            if (!courseName || !Number.isFinite(grade)) {
                return;
            }

            if (!courseGrades[courseName]) {
                courseGrades[courseName] = [];
            }

            courseGrades[courseName].push(grade);
        });
    });

    const labels = Object.keys(courseGrades);

    const averages = labels.map(course => {
        const grades = courseGrades[course];

        return grades.reduce(
            (sum, grade) => sum + grade,
            0
        ) / grades.length;
    });

    if (gradesByCourseChart) {
        gradesByCourseChart.destroy();
    }

    gradesByCourseChart = new Chart(canvas, {
        type: 'bar',

        data: {
            labels,

            datasets: [{
                label: 'Average Grade',
                data: averages,
                backgroundColor: chartColors.secondary,
                borderColor: chartColors.primary,
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 30
            }]
        },

        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: context =>
                            `Average Grade: ${context.parsed.x.toFixed(2)}%`
                    }
                }
            },

            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,

                    title: {
                        display: true,
                        text: 'Grade (%)'
                    }
                },

                y: {
                    ticks: {
                        autoSkip: false
                    }
                }
            }
        }
    });
}

// =====================================
// CHART 2: ATTENDANCE DISTRIBUTION
// DOUGHNUT CHART
// =====================================

function createAttendanceChart(students) {
    const canvas = document.getElementById('attendanceChart');

    if (!canvas) return;

    const statuses = ['Present', 'Late', 'Absent'];

    const counts = statuses.map(status =>
        students.filter(
            student => student.attendance_status === status
        ).length
    );

    if (attendanceChart) {
        attendanceChart.destroy();
    }

    attendanceChart = new Chart(canvas, {
        type: 'doughnut',

        data: {
            labels: statuses,

            datasets: [{
                data: counts,

                backgroundColor: [
                    chartColors.secondary,
                    chartColors.accent,
                    chartColors.danger
                ],

                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: 'bottom'
                },

                tooltip: {
                    callbacks: {
                        label: context =>
                            `${context.label}: ${context.parsed} students`
                    }
                }
            }
        }
    });
}

// =====================================
// CHART 3: ACADEMIC PERFORMANCE OVER TIME
// LINE CHART
// =====================================

function createPerformanceTrendChart(students) {
    const canvas = document.getElementById('performanceTrendChart');

    if (!canvas) return;

    const terms = [
        'Prelim',
        'Midterm',
        'Pre-Final',
        'Final'
    ];

    const averages = terms.map(term => {
        let total = 0;
        let count = 0;

        students.forEach(student => {
            const performance = Array.isArray(student.performance)
                ? student.performance
                : [];

            const record = performance.find(
                item => item.term === term
            );

            if (record && Number.isFinite(Number(record.average))) {
                total += Number(record.average);
                count++;
            }
        });

        return count ? total / count : 0;
    });

    if (performanceTrendChart) {
        performanceTrendChart.destroy();
    }

    performanceTrendChart = new Chart(canvas, {
        type: 'line',

        data: {
            labels: terms,

            datasets: [{
                label: 'Average Academic Grade',
                data: averages,
                borderColor: chartColors.primary,
                backgroundColor: 'rgba(26, 147, 111, 0.15)',
                fill: true,
                tension: 0.35,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: chartColors.secondary
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: 'top'
                },

                tooltip: {
                    callbacks: {
                        label: context =>
                            `Average Grade: ${context.parsed.y.toFixed(2)}`
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,

                    title: {
                        display: true,
                        text: 'Average Grade'
                    }
                }
            }
        }
    });
}
