/* =========================================
   STUDENT GRADE PORTAL
   LAB 3 + LAB 4 - DASHBOARD CONTROLLER
========================================= */

document.addEventListener('DOMContentLoaded', async function () {

    // =====================================
    // CHECK LOGIN
    // =====================================

    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    // =====================================
    // GET HTML ELEMENTS
    // =====================================

    const studentTableBody = document.getElementById('studentTableBody');

    const studentSearch = document.getElementById('studentSearch');
    const courseFilter = document.getElementById('courseFilter');
    const yearLevelFilter = document.getElementById('yearLevelFilter');
    const classCodeFilter = document.getElementById('classCodeFilter');
    const attendanceFilter = document.getElementById('attendanceFilter');

    const minGradeFilter = document.getElementById('minGradeFilter');
    const maxGradeFilter = document.getElementById('maxGradeFilter');

    const sortBy = document.getElementById('sortBy');
    const sortDirection = document.getElementById('sortDirection');

    const addStudentForm = document.getElementById('addStudentForm');

    const notification = document.getElementById('notification');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');

    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const exportStudentsBtn = document.getElementById('exportStudentsBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    const atRiskAlert = document.getElementById('atRiskAlert');
    const atRiskStudentsList = document.getElementById('atRiskStudentsList');

    const simulateUpdatesBtn =
        document.getElementById('simulateUpdatesBtn');

    const simulationStatus =
        document.getElementById('simulationStatus');

    // =====================================
    // LAB 4: querySelector()
    // =====================================

    const greetingElement = document.querySelector('#greeting');
    const studentInfoSection = document.querySelector('.student-info');

    // =====================================
    // HELPER FUNCTIONS
    // =====================================

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[character]);
    }

    // SEARCH HIGHLIGHTING
    function highlightText(value, searchTerm) {
        const text = String(value ?? '');
        const term = String(searchTerm ?? '').trim();

        if (!term) {
            return escapeHTML(text);
        }

        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');

        return text.split(regex).map(part => {
            if (part.toLowerCase() === term.toLowerCase()) {
                return `<mark class="bg-warning">${escapeHTML(part)}</mark>`;
            }

            return escapeHTML(part);
        }).join('');
    }

    function showNotification(message, type = 'success') {
        if (!notification) return;

        notification.textContent = message;
        notification.className = `alert alert-${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    function showLoading(show) {
        if (loadingState) {
            loadingState.style.display = show ? 'block' : 'none';
        }
    }

    function showError(message) {
        if (!errorState) return;

        errorState.textContent = message;
        errorState.style.display = 'block';
    }

    // =====================================
    // LAB 3: UPDATE GREETING
    // =====================================

    function updateGreeting() {
        if (!greetingElement) return;

        const hour = new Date().getHours();
        let timeOfDay = '';

        if (hour >= 5 && hour < 12) {
            timeOfDay = 'Good morning';
        } else if (hour >= 12 && hour < 17) {
            timeOfDay = 'Good afternoon';
        } else if (hour >= 17 && hour < 21) {
            timeOfDay = 'Good evening';
        } else {
            timeOfDay = 'Good night';
        }

        greetingElement.textContent = `${timeOfDay}, Student!`;
    }

    // =====================================
    // LAB 3: UPDATE STUDENT INFORMATION
    // =====================================

    function updateStudentInfo() {
        const student = {
            name: 'Un Hyo Jeremiah M. Oday',
            course: 'Information Technology'
        };

        const studentName = document.getElementById('studentName');
        const studentCourse = document.getElementById('studentCourse');

        if (studentName) {
            studentName.textContent = student.name;
        }

        if (studentCourse) {
            studentCourse.textContent = student.course;
        }

        if (studentInfoSection) {
            studentInfoSection.setAttribute('aria-label', 'Student information');
        }
    }

    // =====================================
    // LAB 3: POPULATE RECENT ACTIVITY
    // =====================================

    function populateActivityTable() {
        const tableBody = document.getElementById('activityTableBody');

        if (!tableBody) return;

        const activities = [
            {
                date: '2026-10-22 14:30',
                activity: 'Lab Exercise 3 submitted - Web Systems and Technologies',
                status: 'success'
            },
            {
                date: '2026-10-22 13:15',
                activity: 'Quiz graded - Database (88)',
                status: 'info'
            },
            {
                date: '2026-10-22 11:45',
                activity: 'Assignment due soon - Java Programming',
                status: 'warning'
            },
            {
                date: '2026-10-21 09:00',
                activity: 'Final Project graded - Web Development (90)',
                status: 'success'
            },
            {
                date: '2026-10-20 16:20',
                activity: 'Midterm Exam graded - Java Programming (92)',
                status: 'success'
            },
            {
                date: '2026-10-19 14:10',
                activity: 'Missing requirement flagged - Database Activity 3',
                status: 'danger'
            }
        ];

        tableBody.innerHTML = '';

        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.className = 'border-accent';

            let badgeClass = 'bg-secondary';

            if (activity.status === 'success') {
                badgeClass = 'bg-success';
            } else if (activity.status === 'warning') {
                badgeClass = 'bg-warning text-dark';
            } else if (activity.status === 'danger') {
                badgeClass = 'bg-danger';
            } else if (activity.status === 'info') {
                badgeClass = 'bg-info text-dark';
            }

            row.innerHTML = `
                <td>${escapeHTML(activity.date)}</td>
                <td>${escapeHTML(activity.activity)}</td>
                <td>
                    <span class="badge ${badgeClass}">
                        ${escapeHTML(activity.status)}
                    </span>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    // =====================================
    // LAB 4: UPDATE DASHBOARD STATISTICS
    // =====================================

    function updateStatistics() {
        const stats = getStudentStatistics();

        document.getElementById('totalStudents').textContent = stats.total;
        document.getElementById('averageGrade').textContent =
            `${stats.averageGrade}%`;
        document.getElementById('averageAttendance').textContent =
            `${stats.averageAttendance}%`;
        document.getElementById('activeStudents').textContent =
            stats.activeStudents;
        document.getElementById('atRiskStudents').textContent =
            stats.atRiskStudents;
    }

    // =====================================
    // LAB 4: DISPLAY AT-RISK STUDENTS
    // classList.toggle() and removeChild()
    // =====================================

    function renderAtRiskStudents() {
        if (!atRiskAlert || !atRiskStudentsList) return;

        const atRiskStudents = getStudents().filter(student =>
            Number(student.grade) < 80 ||
            Number(student.attendance) < 75
        );

        // REMOVE OLD LIST ITEMS USING removeChild()
        while (atRiskStudentsList.firstChild) {
            atRiskStudentsList.removeChild(
                atRiskStudentsList.firstChild
            );
        }

        // TOGGLE ALERT VISIBILITY
        atRiskAlert.classList.toggle(
            'd-none',
            atRiskStudents.length === 0
        );

        if (atRiskStudents.length === 0) return;

        atRiskStudents.forEach(student => {
            const listItem = document.createElement('li');

            const reasons = [];

            if (Number(student.grade) < 80) {
                reasons.push('Low grade');
            }

            if (Number(student.attendance) < 75) {
                reasons.push('Low attendance');
            }

            listItem.innerHTML = `
                <strong>${escapeHTML(student.name)}</strong>
                — Grade: ${escapeHTML(student.grade)}% |
                Attendance: ${escapeHTML(student.attendance)}%
                <span class="text-muted">
                    (${escapeHTML(reasons.join(' and '))})
                </span>
            `;

            atRiskStudentsList.appendChild(listItem);
        });
    }

    // =====================================
    // LAB 4: POPULATE FILTER OPTIONS
    // =====================================

    function populateFilter(element, values, defaultText = 'All') {
        if (!element) return;

        const previousValue = element.value;

        element.innerHTML = `<option value="">${defaultText}</option>`;

        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            element.appendChild(option);
        });

        if (values.includes(previousValue)) {
            element.value = previousValue;
        }
    }

    function populateFilters() {
        populateFilter(courseFilter, getUniqueValues('course'));
        populateFilter(yearLevelFilter, getUniqueValues('year_level'));
        populateFilter(classCodeFilter, getUniqueValues('class_code'));
    }

    // =====================================
    // LAB 4: DISPLAY STUDENT RECORDS
    // =====================================

    function renderStudents() {
        if (!studentTableBody) return;

        const filters = {
            search: studentSearch?.value || '',
            course: courseFilter?.value || '',
            yearLevel: yearLevelFilter?.value || '',
            classCode: classCodeFilter?.value || '',
            status: attendanceFilter?.value || '',
            minGrade: minGradeFilter?.value || '',
            maxGrade: maxGradeFilter?.value || ''
        };

        let filteredStudents = applyFilters(filters);

        filteredStudents = sortStudents(
            filteredStudents,
            sortBy?.value || 'name',
            sortDirection?.value || 'asc'
        );

        if (filteredStudents.length === 0) {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        No student records found.
                    </td>
                </tr>
            `;
            return;
        }

        const searchTerm = studentSearch?.value || '';

        studentTableBody.innerHTML = filteredStudents.map(student => `
            <tr>
                <td>${highlightText(student.student_id, searchTerm)}</td>
                <td>${highlightText(student.name, searchTerm)}</td>
                <td>${highlightText(student.course, searchTerm)}</td>
                <td>${highlightText(student.year_level, searchTerm)}</td>
                <td>${highlightText(student.class_code, searchTerm)}</td>
                <td>${highlightText(student.grade, searchTerm)}%</td>
                <td>${highlightText(student.attendance, searchTerm)}%</td>
                <td>
                    <span class="badge ${
                        student.attendance_status === 'Present'
                            ? 'bg-success'
                            : student.attendance_status === 'Late'
                                ? 'bg-warning text-dark'
                                : 'bg-danger'
                    }">
                        ${highlightText(student.attendance_status, searchTerm)}
                    </span>
                </td>
                <td>
                    <button
                        class="btn btn-sm btn-primary edit-student-btn"
                        data-id="${Number(student.id)}">
                        Edit
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // =====================================
    // LAB 4: DISPLAY RECENT STUDENT CHANGES
    // =====================================

    function renderStudentChanges() {
        const changesContainer = document.getElementById('studentChanges');

        if (!changesContainer) return;

        const changes = getStudentChanges();

        if (changes.length === 0) {
            changesContainer.innerHTML =
                '<p class="text-muted mb-0">No recent changes.</p>';
            return;
        }

        changesContainer.innerHTML = changes.slice(0, 5).map(change => `
            <div class="border-bottom py-2">
                <strong>${escapeHTML(change.action)}</strong>
                ${escapeHTML(change.name)}
                <br>
                <small class="text-muted">${escapeHTML(change.date)}</small>
            </div>
        `).join('');
    }

    // =====================================
    // LAB 4: REFRESH DASHBOARD
    // =====================================

    function refreshDashboard() {
        updateStatistics();
        renderAtRiskStudents();
        populateFilters();
        renderStudents();
        renderStudentChanges();

        if (typeof updateCharts === 'function') {
            updateCharts();
        }
    }

    // =====================================
    // LAB 4: SEARCH AND FILTER EVENTS
    // querySelectorAll()
    // =====================================

    const filterControls = document.querySelectorAll(
        '#studentSearch, #courseFilter, #yearLevelFilter, ' +
        '#classCodeFilter, #attendanceFilter, #minGradeFilter, ' +
        '#maxGradeFilter, #sortBy, #sortDirection'
    );

    filterControls.forEach(element => {
        element.addEventListener('input', renderStudents);
        element.addEventListener('change', renderStudents);
    });

    // =====================================
    // LAB 4: RESET FILTERS
    // =====================================

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function () {
            if (studentSearch) studentSearch.value = '';
            if (courseFilter) courseFilter.value = '';
            if (yearLevelFilter) yearLevelFilter.value = '';
            if (classCodeFilter) classCodeFilter.value = '';
            if (attendanceFilter) attendanceFilter.value = '';

            if (minGradeFilter) minGradeFilter.value = '';
            if (maxGradeFilter) maxGradeFilter.value = '';

            if (sortBy) sortBy.value = 'name';
            if (sortDirection) sortDirection.value = 'asc';

            renderStudents();
        });
    }

    // =====================================
    // LAB 4: ADD NEW STUDENT
    // =====================================

    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const studentData = {
                student_id: document.getElementById('newStudentId').value.trim(),
                name: document.getElementById('newStudentName').value.trim(),
                course: document.getElementById('newStudentCourse').value.trim(),
                year_level: document.getElementById('newStudentYear').value,
                class_code: document.getElementById('newStudentClass').value.trim(),
                grade: Number(document.getElementById('newStudentGrade').value),
                attendance: Number(document.getElementById('newStudentAttendance').value)
            };

            try {
                await addStudent(studentData);

                addStudentForm.reset();
                refreshDashboard();

                showNotification('Student added successfully!');

            } catch (error) {
                console.error('Unable to add student:', error);
                showNotification(error.message, 'danger');
            }
        });
    }

    // =====================================
    // LAB 4: EDIT STUDENT RECORD
    // =====================================

    if (studentTableBody) {
        studentTableBody.addEventListener('click', async function (event) {

            const editButton = event.target.closest('.edit-student-btn');

            if (!editButton) return;

            const studentId = Number(editButton.dataset.id);
            const student = getStudentById(studentId);

            if (!student) return;

            const newStudentId = prompt('Enter Student ID:', student.student_id);
            if (newStudentId === null) return;

            const newName = prompt('Enter Full Name:', student.name);
            if (newName === null) return;

            const newCourse = prompt('Enter Course:', student.course);
            if (newCourse === null) return;

            const newYear = prompt(
                'Enter Year Level (1st Year, 2nd Year, 3rd Year, 4th Year):',
                student.year_level
            );
            if (newYear === null) return;

            const newClassCode = prompt('Enter CN Code:', student.class_code);
            if (newClassCode === null) return;

            const newGrade = prompt('Enter Grade (0-100):', student.grade);
            if (newGrade === null) return;

            const newAttendance = prompt(
                'Enter Attendance (0-100):',
                student.attendance
            );
            if (newAttendance === null) return;

            const studentData = {
                student_id: newStudentId.trim(),
                name: newName.trim(),
                course: newCourse.trim(),
                year_level: newYear.trim(),
                class_code: newClassCode.trim(),
                grade: Number(newGrade),
                attendance: Number(newAttendance)
            };

            if (
                !studentData.student_id ||
                !studentData.name ||
                !studentData.course ||
                !studentData.year_level ||
                !studentData.class_code
            ) {
                showNotification('Please complete all student fields.', 'danger');
                return;
            }

            if (
                !Number.isFinite(studentData.grade) ||
                studentData.grade < 0 ||
                studentData.grade > 100
            ) {
                showNotification('Grade must be between 0 and 100.', 'danger');
                return;
            }

            if (
                !Number.isFinite(studentData.attendance) ||
                studentData.attendance < 0 ||
                studentData.attendance > 100
            ) {
                showNotification('Attendance must be between 0 and 100.', 'danger');
                return;
            }

            const validYears = [
                '1st Year',
                '2nd Year',
                '3rd Year',
                '4th Year'
            ];

            if (!validYears.includes(studentData.year_level)) {
                showNotification('Please enter a valid year level.', 'danger');
                return;
            }

            try {
                await updateStudent(studentId, studentData);

                refreshDashboard();

                showNotification('Student record updated successfully!');

            } catch (error) {
                console.error('Unable to update student:', error);
                showNotification(error.message, 'danger');
            }
        });
    }

    // =====================================
    // LAB 4: SIMULATED REAL-TIME UPDATES
    // setAttribute()
    // =====================================

    if (simulateUpdatesBtn) {
        simulateUpdatesBtn.addEventListener('click', async function () {

            simulateUpdatesBtn.disabled = true;

            // UPDATE ACCESSIBILITY ATTRIBUTE
            simulateUpdatesBtn.setAttribute('aria-busy', 'true');

            if (simulationStatus) {
                simulationStatus.textContent = 'Simulating update...';
            }

            try {
                await new Promise(resolve => setTimeout(resolve, 700));

                const updatedStudent = simulateStudentUpdate();

                if (!updatedStudent) {
                    throw new Error('No student records available.');
                }

                refreshDashboard();

                if (simulationStatus) {
                    simulationStatus.textContent =
                        `Updated ${updatedStudent.name} — ` +
                        `Grade: ${updatedStudent.grade}% | ` +
                        `Attendance: ${updatedStudent.attendance}%`;
                }

            } catch (error) {
                console.error('Simulation failed:', error);

                if (simulationStatus) {
                    simulationStatus.textContent = error.message;
                }

            } finally {
                simulateUpdatesBtn.disabled = false;

                simulateUpdatesBtn.setAttribute('aria-busy', 'false');
            }
        });
    }

    // =====================================
    // LAB 4: EXPORT STUDENTS TO CSV
    // =====================================

    if (exportStudentsBtn) {
        exportStudentsBtn.addEventListener('click', function () {
            const filters = {
                search: studentSearch?.value || '',
                course: courseFilter?.value || '',
                yearLevel: yearLevelFilter?.value || '',
                classCode: classCodeFilter?.value || '',
                status: attendanceFilter?.value || '',
                minGrade: minGradeFilter?.value || '',
                maxGrade: maxGradeFilter?.value || ''
            };

            const filteredStudents = applyFilters(filters);

            if (filteredStudents.length === 0) {
                showNotification('No student records to export.', 'warning');
                return;
            }

            exportToCSV(filteredStudents);
            showNotification('Student records exported successfully!');
        });
    }

    // =====================================
    // LAB 4: LOGOUT
    // =====================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');

            window.location.href = 'index.html';
        });
    }

    // =====================================
    // INITIALIZE DASHBOARD
    // =====================================

    try {
        updateGreeting();
        updateStudentInfo();
        populateActivityTable();

        showLoading(true);

        await initializeData();

        refreshDashboard();

        if (typeof initializeCharts === 'function') {
            initializeCharts();
        }

        showLoading(false);

    } catch (error) {
        console.error('Dashboard initialization failed:', error);

        showLoading(false);

        showError(
            'Unable to load student records. Please check your PHP API connection.'
        );
    }

});
