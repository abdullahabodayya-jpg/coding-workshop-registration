
<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("POST");
requireAdmin();

$data = readJsonBody();
$id = trim($data["id"] ?? "");

if ($id === "") {
    jsonResponse(422, [
        "success" => false,
        "message" => "User ID is required."
    ]);
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->prepare("
        SELECT id, role
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
            "message" => "Admin accounts cannot be deleted here."
        ]);
    }

    /*
     * Check workshop registrations before deleting.
     * Assumes registrations.user_id references users.id.
     */
    $check = $pdo->prepare("
        SELECT COUNT(*)
        FROM registrations
        WHERE user_id = :user_id
    ");

    $check->execute(["user_id" => $id]);

    if ((int) $check->fetchColumn() > 0) {
        jsonResponse(409, [
            "success" => false,
            "message" => "This user has workshop registrations. Suspend the account instead."
        ]);
    }

    /*
     * Delete only after confirming that no registrations exist.
     * Add checks for other tables that reference users before
     * enabling deletion in your actual database.
     */
    $delete = $pdo->prepare("
        DELETE FROM users
        WHERE id = :id AND role <> 'admin'
    ");

    $delete->execute(["id" => $id]);

    jsonResponse(200, [
        "success" => true,
        "message" => "User deleted successfully."
    ]);

} catch (Throwable $e) {
    error_log("Delete user error: " . $e->getMessage());

    jsonResponse(500, [
        "success" => false,
        "message" => "Failed to delete user."
    ]);
}
