/* =====================================
   STUDENT GRADE PORTAL
   LAB 4 - DATA MANAGER
===================================== */

let students = [];
let studentChanges = [];

const STUDENTS_API = 'api_students.php';
const ADD_STUDENT_API = 'api_add_student.php';
const UPDATE_STUDENT_API = 'api_update_student.php';

// =====================================
// LOAD STUDENTS FROM PHP API
// =====================================

async function initializeData() {
    try {
        const response = await fetch(STUDENTS_API, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.students)) {
            throw new Error(result.message || 'Invalid student data.');
        }

        students = result.students;

        return students;

    } catch (error) {
        console.error('Unable to load students:', error);
        throw error;
    }
}

// =====================================
// GET ALL STUDENTS
// =====================================

function getStudents() {
    return [...students];
}

// =====================================
// GET STUDENT BY ID
// =====================================

function getStudentById(id) {
    return students.find(
        student => Number(student.id) === Number(id)
    );
}

// =====================================
// GET STUDENTS BY COURSE
// =====================================

function getStudentsByCourse(courseName) {
    return students.filter(
        student => student.course === courseName
    );
}

// =====================================
// GET AT-RISK STUDENTS
// =====================================

function getAtRiskStudents() {
    return students.filter(student =>
        Number(student.grade) < 80 ||
        Number(student.attendance) < 75
    );
}

// =====================================
// GET DASHBOARD STATISTICS
// =====================================

function getStudentStatistics() {
    const total = students.length;

    const averageGrade = total
        ? students.reduce(
            (sum, student) => sum + Number(student.grade),
            0
        ) / total
        : 0;

    const averageAttendance = total
        ? students.reduce(
            (sum, student) => sum + Number(student.attendance),
            0
        ) / total
        : 0;

    const activeStudents = students.filter(
        student => student.status === 'Active'
    ).length;

    const atRiskStudents = getAtRiskStudents().length;

    return {
        total,
        averageGrade: Number(averageGrade.toFixed(2)),
        averageAttendance: Number(averageAttendance.toFixed(2)),
        activeStudents,
        atRiskStudents
    };
}

// =====================================
// GET UNIQUE FILTER VALUES
// =====================================

function getUniqueValues(field) {
    return [...new Set(
        students.map(student => student[field]).filter(Boolean)
    )].sort();
}

// =====================================
// SEARCH STUDENTS
// =====================================

function searchStudents(keyword) {
    const search = String(keyword || '').toLowerCase().trim();

    if (!search) {
        return getStudents();
    }

    return students.filter(student =>
        String(student.name).toLowerCase().includes(search) ||
        String(student.student_id).toLowerCase().includes(search) ||
        String(student.class_code).toLowerCase().includes(search)
    );
}

// =====================================
// APPLY FILTERS
// =====================================

function applyFilters(filters = {}) {
    return students.filter(student => {

        const search = String(
            filters.search || ''
        ).toLowerCase().trim();

        const matchesSearch =
            !search ||
            String(student.name).toLowerCase().includes(search) ||
            String(student.student_id).toLowerCase().includes(search) ||
            String(student.class_code).toLowerCase().includes(search);

        const matchesCourse =
            !filters.course || student.course === filters.course;

        const matchesYear =
            !filters.yearLevel ||
            student.year_level === filters.yearLevel;

        const matchesClass =
            !filters.classCode ||
            student.class_code === filters.classCode;

        const matchesStatus =
            !filters.status ||
            student.attendance_status === filters.status;

        const grade = Number(student.grade);

        const matchesMinGrade =
            filters.minGrade === '' ||
            filters.minGrade === undefined ||
            grade >= Number(filters.minGrade);

        const matchesMaxGrade =
            filters.maxGrade === '' ||
            filters.maxGrade === undefined ||
            grade <= Number(filters.maxGrade);

        return (
            matchesSearch &&
            matchesCourse &&
            matchesYear &&
            matchesClass &&
            matchesStatus &&
            matchesMinGrade &&
            matchesMaxGrade
        );
    });
}

// =====================================
// SORT STUDENTS
// =====================================

function sortStudents(records, field = 'name', direction = 'asc') {
    const sorted = [...records];

    sorted.sort((a, b) => {
        let first = a[field];
        let second = b[field];

        if (['grade', 'attendance'].includes(field)) {
            first = Number(first);
            second = Number(second);
        } else {
            first = String(first || '').toLowerCase();
            second = String(second || '').toLowerCase();
        }

        if (first < second) {
            return direction === 'asc' ? -1 : 1;
        }

        if (first > second) {
            return direction === 'asc' ? 1 : -1;
        }

        return 0;
    });

    return sorted;
}

// =====================================
// RECORD RECENT CHANGES
// =====================================

function recordChange(action, name) {
    studentChanges.unshift({
        action,
        name,
        date: new Date().toLocaleString()
    });

    studentChanges = studentChanges.slice(0, 5);
}

// =====================================
// GET RECENT CHANGES
// =====================================

function getStudentChanges() {
    return [...studentChanges];
}

// =====================================
// LAB 4: SIMULATE STUDENT UPDATE
// TEMPORARY CLIENT-SIDE CHANGE
// =====================================

function simulateStudentUpdate() {
    if (students.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(
        Math.random() * students.length
    );

    const student = students[randomIndex];

    const possibleChanges = [-2, -1, 1, 2];

    const gradeChange =
        possibleChanges[
            Math.floor(Math.random() * possibleChanges.length)
        ];

    const attendanceChange =
        possibleChanges[
            Math.floor(Math.random() * possibleChanges.length)
        ];

    student.grade = Math.max(
        0,
        Math.min(100, Number(student.grade) + gradeChange)
    );

    student.attendance = Math.max(
        0,
        Math.min(100, Number(student.attendance) + attendanceChange)
    );

    if (Number(student.attendance) >= 90) {
        student.attendance_status = 'Present';
    } else if (Number(student.attendance) >= 75) {
        student.attendance_status = 'Late';
    } else {
        student.attendance_status = 'Absent';
    }

    recordChange('Simulated update:', student.name);

    return {
        name: student.name,
        grade: student.grade,
        attendance: student.attendance,
        attendance_status: student.attendance_status
    };
}

// =====================================
// ADD STUDENT
// =====================================

async function addStudent(studentData) {
    const response = await fetch(ADD_STUDENT_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.message || 'Unable to add student.'
        );
    }

    await initializeData();

    recordChange('Added student:', studentData.name);

    return result;
}

// =====================================
// UPDATE STUDENT
// =====================================

async function updateStudent(id, updates) {
    const response = await fetch(UPDATE_STUDENT_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id,
            ...updates
        })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.message || 'Unable to update student.'
        );
    }

    await initializeData();

    const updatedStudent = getStudentById(id);

    recordChange(
        'Updated student:',
        updatedStudent
            ? updatedStudent.name
            : `ID ${id}`
    );

    return result;
}

// =====================================
// EXPORT STUDENTS TO CSV
// =====================================

function exportToCSV(records = students) {
    if (!records.length) {
        alert('No student records to export.');
        return;
    }

    const headers = [
        'Student ID',
        'Name',
        'Course',
        'Year Level',
        'CN Code',
        'Grade',
        'Attendance',
        'Attendance Status',
        'Status'
    ];

    const rows = records.map(student => [
        student.student_id,
        student.name,
        student.course,
        student.year_level,
        student.class_code,
        student.grade,
        student.attendance,
        student.attendance_status,
        student.status
    ]);

    const csv = [headers, ...rows]
        .map(row =>
            row.map(value =>
                `"${String(value ?? '').replace(/"/g, '""')}"`
            ).join(',')
        )
        .join('\n');

    const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'student_records.csv';
    link.click();

    URL.revokeObjectURL(url);
}
