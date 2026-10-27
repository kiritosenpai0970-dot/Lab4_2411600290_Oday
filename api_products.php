
<?php
header("Content-Type: application/json");

$file = __DIR__ . "/products.json";

if (!file_exists($file)) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Product storage file not found."
    ]);
    exit;
}

$data = json_decode(file_get_contents($file), true);

if (!is_array($data) || !isset($data["products"]) || !is_array($data["products"])) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Invalid product storage data."
    ]);
    exit;
}

$products = $data["products"];

echo json_encode([
    "success" => true,
    "count" => count($products),
    "products" => $products
], JSON_PRETTY_PRINT);
?>
