<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    header("Allow: GET");

    jsonResponse(405, [
        "success" => false,
        "message" => "Method not allowed."
    ]);
}

try {
    requireAdmin();

    $database = new Database();
    $pdo = $database->connect();

    $statement = $pdo->query("
        SELECT id, name, description, image_url, main_link
        FROM instructors
        ORDER BY name ASC
    ");

    $instructors = $statement->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(200, [
        "success" => true,
        "data" => [
            "instructors" => $instructors
        ]
    ]);
} catch (Throwable $e) {
    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to load instructors."
    ]);
}