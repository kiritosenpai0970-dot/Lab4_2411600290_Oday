<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET');

// CHECK REQUEST METHOD
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);

    exit;
}

// CHECK STUDENT DATA FILE
$file = __DIR__ . '/students.json';

if (!file_exists($file)) {
    http_response_code(404);

    echo json_encode([
        'success' => false,
        'message' => 'Student data file not found.'
    ]);

    exit;
}

// READ STUDENT DATA
$content = file_get_contents($file);

if ($content === false) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to read student data.'
    ]);

    exit;
}

// DECODE JSON DATA
$data = json_decode($content, true);

// VALIDATE JSON DATA
if (
    !is_array($data) ||
    !isset($data['students']) ||
    !is_array($data['students'])
) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid student data.'
    ]);

    exit;
}

// RETURN STUDENT RECORDS
echo json_encode([
    'success' => true,
    'count' => count($data['students']),
    'students' => $data['students']
], JSON_PRETTY_PRINT);

