
<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("POST");
requireAdmin();

$data = readJsonBody();

$id = trim((string) ($data["id"] ?? ""));
$status = trim((string) ($data["status"] ?? ""));
$reply = trim((string) ($data["admin_reply"] ?? ""));

$allowedStatuses = ["open", "in_progress", "resolved"];

if (
    $id === "" ||
    !in_array($status, $allowedStatuses, true) ||
    mb_strlen($reply) > 5000
) {
    jsonResponse(422, [
        "success" => false,
        "message" => "Please check the submitted information."
    ]);
}

if ($status === "resolved" && $reply === "") {
    jsonResponse(422, [
        "success" => false,
        "message" => "A reply is required to resolve a message."
    ]);
}

try {
    $database = new Database();
    $pdo = $database->connect();

    // التأكد من وجود الرسالة
    $check = $pdo->prepare("
        SELECT id, status
        FROM contact_messages
        WHERE id = :id
        LIMIT 1
    ");

    $check->execute(["id" => $id]);
    $message = $check->fetch();

    if (!$message) {
        jsonResponse(404, [
            "success" => false,
            "message" => "Contact message not found."
        ]);
    }

    $resolvedBy = $status === "resolved"
        ? $_SESSION["user_id"]
        : null;

    $resolvedAt = $status === "resolved"
        ? date("Y-m-d H:i:s")
        : null;

    $stmt = $pdo->prepare("
        UPDATE contact_messages
        SET
            status = :status,
            admin_reply = :admin_reply,
            resolved_by = :resolved_by,
            resolved_at = :resolved_at
        WHERE id = :id
    ");

    $stmt->execute([
        "status" => $status,
        "admin_reply" => $reply !== "" ? $reply : null,
        "resolved_by" => $resolvedBy,
        "resolved_at" => $resolvedAt,
        "id" => $id
    ]);

    jsonResponse(200, [
        "success" => true,
        "message" => "Contact message updated successfully."
    ]);

} catch (Throwable $e) {
    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to update the contact message."
    ]);
}
