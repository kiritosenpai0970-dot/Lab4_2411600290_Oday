
<?php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
    exit;
}

$file = __DIR__ . "/products.json";

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data."
    ]);
    exit;
}

$required = ["name", "sku", "category", "quantity", "reorder_level", "unit_price"];

foreach ($required as $field) {
    if (!isset($input[$field]) || trim((string)$input[$field]) === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Missing required field: " . $field
        ]);
        exit;
    }
}

$name = trim((string)$input["name"]);
$sku = trim((string)$input["sku"]);
$category = trim((string)$input["category"]);

if (!is_numeric($input["quantity"]) ||
    !is_numeric($input["reorder_level"]) ||
    !is_numeric($input["unit_price"]) ||
    (float)$input["quantity"] < 0 ||
    (float)$input["reorder_level"] < 0 ||
    (float)$input["unit_price"] < 0 ||
    (float)$input["quantity"] != (int)$input["quantity"] ||
    (float)$input["reorder_level"] != (int)$input["reorder_level"]) {

    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Quantity and reorder level must be non-negative whole numbers; price must be non-negative."
    ]);
    exit;
}

if (!file_exists($file)) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Product storage file not found."
    ]);
    exit;
}

$fp = fopen($file, "c+");

if (!$fp || !flock($fp, LOCK_EX)) {
    if ($fp) {
        fclose($fp);
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not access product storage."
    ]);
    exit;
}

$stored = stream_get_contents($fp);
$data = json_decode($stored, true);

if (!is_array($data) || !isset($data["products"]) || !is_array($data["products"])) {
    flock($fp, LOCK_UN);
    fclose($fp);

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Invalid product storage data."
    ]);
    exit;
}

foreach ($data["products"] as $product) {
    if (strcasecmp($product["sku"] ?? "", $sku) === 0) {
        flock($fp, LOCK_UN);
        fclose($fp);

        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "That SKU already exists."
        ]);
        exit;
    }
}

$maxId = 0;

foreach ($data["products"] as $product) {
    $maxId = max($maxId, (int)($product["id"] ?? 0));
}

$newProduct = [
    "id" => $maxId + 1,
    "name" => $name,
    "sku" => $sku,
    "category" => $category,
    "quantity" => (int)$input["quantity"],
    "reorder_level" => (int)$input["reorder_level"],
    "unit_price" => (float)$input["unit_price"]
];

$data["products"][] = $newProduct;

rewind($fp);
ftruncate($fp, 0);
$written = fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
fflush($fp);

flock($fp, LOCK_UN);
fclose($fp);

if ($written === false) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not save the new product."
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Product added successfully.",
    "product" => $newProduct
], JSON_PRETTY_PRINT);
?>
