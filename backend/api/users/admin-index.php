<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("GET");
requireAdmin();

try {
    $database = new Database();
    $pdo = $database->connect();

    $search = trim($_GET["search"] ?? "");
    $role = trim($_GET["role"] ?? "");
    $status = trim($_GET["status"] ?? "");

    $where = [];
    $params = [];

    if ($search !== "") {
        $where[] = "(
            first_name LIKE :search_name
            OR last_name LIKE :search_last
            OR email LIKE :search_email
            OR phone LIKE :search_phone
        )";

        $term = "%" . $search . "%";

        $params["search_name"] = $term;
        $params["search_last"] = $term;
        $params["search_email"] = $term;
        $params["search_phone"] = $term;
    }

    if (in_array($role, ["participant", "admin"], true)) {
        $where[] = "role = :role";
        $params["role"] = $role;
    }

    if (in_array($status, ["active", "suspended"], true)) {
        $where[] = "status = :status";
        $params["status"] = $status;
    }

    $whereSql = $where
        ? "WHERE " . implode(" AND ", $where)
        : "";

    $sql = "
        SELECT
            id,
            first_name,
            last_name,
            email,
            phone,
            role,
            status,
            created_at
        FROM users
        $whereSql
        ORDER BY created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $statsStmt = $pdo->query("
        SELECT
            COUNT(*) AS total_users,
            COALESCE(SUM(status = 'active'), 0) AS active_users,
            COALESCE(SUM(status = 'suspended'), 0) AS suspended_users,
            COALESCE(SUM(role = 'admin'), 0) AS admin_users
        FROM users
    ");

    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    jsonResponse(200, [
        "success" => true,
        "data" => [
            "users" => $users,
            "stats" => $stats
        ]
    ]);

} catch (Throwable $e) {
    error_log("Admin users index error: " . $e->getMessage());

    jsonResponse(500, [
        "success" => false,
        "message" => "Failed to load users."
    ]);
}
