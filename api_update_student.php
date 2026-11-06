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

if (
    !is_array($data) ||
    !isset($data['id']) ||
    !is_numeric($data['id']) ||
    (int)$data['id'] <= 0
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'A valid student ID is required.'
    ]);

    exit;
}

// =====================================
// ALLOWED EDITABLE FIELDS
// =====================================

$allowedFields = [
    'name',
    'student_id',
    'course',
    'year_level',
    'class_code',
    'grade',
    'attendance'
];

$textFields = [
    'name',
    'student_id',
    'course',
    'year_level',
    'class_code'
];

// =====================================
// VALIDATE TEXT FIELDS
// =====================================

foreach ($textFields as $field) {
    if (
        !isset($data[$field]) ||
        !is_string($data[$field]) ||
        trim($data[$field]) === ''
    ) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => "Please provide a valid $field."
        ]);

        exit;
    }
}

// =====================================
// VALIDATE GRADE AND ATTENDANCE
// =====================================

foreach (['grade', 'attendance'] as $field) {
    if (
        !isset($data[$field]) ||
        !is_numeric($data[$field]) ||
        !is_finite((float)$data[$field]) ||
        $data[$field] < 0 ||
        $data[$field] > 100
    ) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => "$field must be between 0 and 100."
        ]);

        exit;
    }

    $data[$field] = (float)$data[$field];
}

// =====================================
// VALIDATE YEAR LEVEL
// =====================================

$validYears = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year'
];

if (!in_array($data['year_level'], $validYears, true)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid year level.'
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
// READ STUDENT RECORDS
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
        'message' => 'Invalid student data.'
    ]);

    exit;
}

// =====================================
// FIND STUDENT
// =====================================

$studentIndex = null;
$studentDatabaseId = (int)$data['id'];

foreach ($records['students'] as $index => $student) {
    if (
        isset($student['id']) &&
        (int)$student['id'] === $studentDatabaseId
    ) {
        $studentIndex = $index;
        break;
    }
}

if ($studentIndex === null) {
    flock($handle, LOCK_UN);
    fclose($handle);

    http_response_code(404);

    echo json_encode([
        'success' => false,
        'message' => 'Student not found.'
    ]);

    exit;
}

// =====================================
// CHECK DUPLICATE STUDENT ID
// =====================================

$newStudentId = trim($data['student_id']);

foreach ($records['students'] as $index => $student) {
    if (
        $index !== $studentIndex &&
        isset($student['student_id']) &&
        (string)$student['student_id'] === $newStudentId
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
// UPDATE STUDENT INFORMATION
// =====================================

foreach ($allowedFields as $field) {
    if ($field === 'class_code') {
        $records['students'][$studentIndex][$field] =
            strtoupper(trim($data[$field]));
    } elseif (in_array($field, $textFields, true)) {
        $records['students'][$studentIndex][$field] =
            trim($data[$field]);
    } else {
        $records['students'][$studentIndex][$field] =
            $data[$field];
    }
}

// =====================================
// UPDATE ATTENDANCE STATUS
// =====================================

$attendance = $records['students'][$studentIndex]['attendance'];

$records['students'][$studentIndex]['attendance_status'] =
    $attendance >= 90 ? 'Present' :
    ($attendance >= 75 ? 'Late' : 'Absent');

// =====================================
// UPDATE PERFORMANCE DATA
// =====================================

$grade = $records['students'][$studentIndex]['grade'];

$records['students'][$studentIndex]['performance'] = [
    ['term' => 'Prelim', 'average' => $grade],
    ['term' => 'Midterm', 'average' => $grade],
    ['term' => 'Pre-Final', 'average' => $grade],
    ['term' => 'Final', 'average' => $grade]
];

// =====================================
// ENCODE UPDATED RECORDS
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
// SAVE UPDATED RECORDS
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
        'message' => 'Unable to save student changes.'
    ]);

    exit;
}

// =====================================
// CLOSE FILE
// =====================================

flock($handle, LOCK_UN);
fclose($handle);

// =====================================
// SUCCESS RESPONSE
// =====================================

echo json_encode([
    'success' => true,
    'message' => 'Student updated successfully.',
    'student' => $records['students'][$studentIndex]
]);

