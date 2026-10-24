
<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("POST");
requireAdmin();

$data = readJsonBody();

$id = trim($data["id"] ?? "");
$status = trim($data["status"] ?? "");

if ($id === "" || !in_array($status, ["active", "suspended"], true)) {
    jsonResponse(422, [
        "success" => false,
        "message" => "Valid user ID and status are required."
    ]);
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->prepare("
        SELECT id, role, status
        FROM users
        WHERE id = :id
        LIMIT 1
    ");

    $stmt->execute(["id" => $id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        jsonResponse(404, [
            "success" => false,
            "message" => "User not found."
        ]);
    }

    if ($user["role"] === "admin") {
        jsonResponse(403, [
            "success" => false,
            "message" => "Admin accounts cannot be changed here."
        ]);
    }

    $update = $pdo->prepare("
        UPDATE users
        SET status = :status
        WHERE id = :id
    ");

    $update->execute([
        "status" => $status,
        "id" => $id
    ]);

    jsonResponse(200, [
        "success" => true,
        "message" => $status === "active"
            ? "User activated successfully."
            : "User suspended successfully."
    ]);

} catch (Throwable $e) {
    error_log("Update user status error: " . $e->getMessage());

    jsonResponse(500, [
        "success" => false,
        "message" => "Failed to update user status."
    ]);
}
