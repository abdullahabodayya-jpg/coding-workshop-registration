<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("GET");
requireAdmin();

try {
    $database = new Database();
    $pdo = $database->connect();

    $status = $_GET["status"] ?? "all";

    $allowedStatuses = [
        "all",
        "open",
        "in_progress",
        "resolved"
    ];

    if (!in_array($status, $allowedStatuses, true)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Invalid message status."
        ]);
    }

    $sql = "
        SELECT
            id,
            name,
            email,
            subject,
            message,
            status,
            admin_reply,
            created_at,
            resolved_at
        FROM contact_messages
    ";

    $params = [];

    if ($status !== "all") {
        $sql .= " WHERE status = :status";
        $params["status"] = $status;
    }

    $sql .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    jsonResponse(200, [
        "success" => true,
        "messages" => $stmt->fetchAll()
    ]);

} catch (Throwable $e) {
    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to load contact messages."
    ]);
}
