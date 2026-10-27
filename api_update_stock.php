
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

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input) ||
    !isset($input["id"], $input["quantity"]) ||
    !is_numeric($input["id"]) ||
    !is_numeric($input["quantity"]) ||
    (int)$input["id"] <= 0 ||
    (int)$input["quantity"] < 0 ||
    (float)$input["id"] != (int)$input["id"] ||
    (float)$input["quantity"] != (int)$input["quantity"]) {

    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "A valid product ID and non-negative whole-number quantity are required."
    ]);
    exit;
}

$file = __DIR__ . "/products.json";

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

$data = json_decode(stream_get_contents($fp), true);

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

$productIndex = null;

foreach ($data["products"] as $index => $product) {
    if ((int)($product["id"] ?? 0) === (int)$input["id"]) {
        $productIndex = $index;
        break;
    }
}

if ($productIndex === null) {
    flock($fp, LOCK_UN);
    fclose($fp);

    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "Product not found."
    ]);
    exit;
}

$data["products"][$productIndex]["quantity"] = (int)$input["quantity"];

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
        "message" => "Could not save the stock update."
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Stock updated successfully.",
    "id" => (int)$input["id"],
    "quantity" => (int)$input["quantity"]
], JSON_PRETTY_PRINT);
?>
