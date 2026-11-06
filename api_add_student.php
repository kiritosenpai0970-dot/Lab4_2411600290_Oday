<?php

header('Content-Type: application/json; charset=utf-8');

// =====================================
// CHECK REQUEST METHOD
// =====================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);

    exit;
}

// =====================================
// READ REQUEST DATA
// =====================================

$file = __DIR__ . '/students.json';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid request data.'
    ]);

    exit;
}

// =====================================
// VALIDATE REQUIRED FIELDS
// =====================================

$required = [
    'student_id',
    'name',
    'course',
    'year_level',
    'class_code',
    'grade',
    'attendance'
];

foreach ($required as $field) {
    if (
        !isset($data[$field]) ||
        trim((string)$data[$field]) === ''
    ) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => "Please provide $field."
        ]);

        exit;
    }
}

// =====================================
// CLEAN INPUT DATA
// =====================================

$studentId = trim((string)$data['student_id']);
$name = trim((string)$data['name']);
$course = trim((string)$data['course']);
$yearLevel = trim((string)$data['year_level']);
$classCode = strtoupper(trim((string)$data['class_code']));

$grade = filter_var($data['grade'], FILTER_VALIDATE_FLOAT);
$attendance = filter_var($data['attendance'], FILTER_VALIDATE_FLOAT);

// =====================================
// VALIDATE GRADE AND ATTENDANCE
// =====================================

if (
    $grade === false ||
    $grade < 0 ||
    $grade > 100 ||
    $attendance === false ||
    $attendance < 0 ||
    $attendance > 100
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Grade and attendance must be between 0 and 100.'
    ]);

    exit;
}

// =====================================
// CHECK STUDENT DATA FILE
// =====================================

if (!file_exists($file)) {
    http_response_code(404);

    echo json_encode([
        'success' => false,
        'message' => 'Student data file not found.'
    ]);

    exit;
}

// =====================================
// OPEN AND LOCK FILE
// =====================================

$handle = fopen($file, 'c+');

if ($handle === false) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to access student records.'
    ]);

    exit;
}

if (!flock($handle, LOCK_EX)) {
    fclose($handle);

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to lock student records.'
    ]);

    exit;
}

// =====================================
// READ EXISTING STUDENTS
// =====================================

$contents = stream_get_contents($handle);
$records = json_decode($contents, true);

if (
    !is_array($records) ||
    !isset($records['students']) ||
    !is_array($records['students'])
) {
    flock($handle, LOCK_UN);
    fclose($handle);

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid student data file.'
    ]);

    exit;
}

// =====================================
// CHECK DUPLICATE STUDENT ID
// =====================================

foreach ($records['students'] as $student) {
    if (
        isset($student['student_id']) &&
        (string)$student['student_id'] === $studentId
    ) {
        flock($handle, LOCK_UN);
        fclose($handle);

        http_response_code(409);

        echo json_encode([
            'success' => false,
            'message' => 'Student ID already exists.'
        ]);

        exit;
    }
}

// =====================================
// GENERATE NEW DATABASE ID
// =====================================

$newId = 1;

foreach ($records['students'] as $student) {
    if (isset($student['id'])) {
        $newId = max($newId, (int)$student['id'] + 1);
    }
}

// =====================================
// CREATE NEW STUDENT
// =====================================

$newStudent = [
    'id' => $newId,
    'student_id' => $studentId,
    'name' => $name,
    'course' => $course,
    'year_level' => $yearLevel,
    'class_code' => $classCode,
    'grade' => $grade,
    'attendance' => $attendance,
    'attendance_status' => 'Present',
    'status' => 'Active',
    'courses' => [],
    'performance' => [
        ['term' => 'Prelim', 'average' => $grade],
        ['term' => 'Midterm', 'average' => $grade],
        ['term' => 'Pre-Final', 'average' => $grade],
        ['term' => 'Final', 'average' => $grade]
    ]
];

$records['students'][] = $newStudent;

// =====================================
// ENCODE UPDATED STUDENT DATA
// =====================================

$json = json_encode(
    $records,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
);

if ($json === false) {
    flock($handle, LOCK_UN);
    fclose($handle);

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to encode student records.'
    ]);

    exit;
}

// =====================================
// SAVE UPDATED STUDENT DATA
// =====================================

rewind($handle);
ftruncate($handle, 0);

$written = fwrite($handle, $json);

fflush($handle);

if ($written === false || $written !== strlen($json)) {
    flock($handle, LOCK_UN);
    fclose($handle);

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to save student record.'
    ]);

    exit;
}

// =====================================
// CLOSE FILE
// =====================================

flock($handle, LOCK_UN);
fclose($handle);

// =====================================
// RETURN SUCCESS RESPONSE
// =====================================

echo json_encode([
    'success' => true,
    'message' => 'Student added successfully.',
    'student' => $newStudent
]);

