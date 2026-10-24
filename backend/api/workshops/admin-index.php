<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("GET");

try {
    requireAdmin();

    $database = new Database();
    $pdo = $database->connect();

    $sql = "
        SELECT
            w.id,
            w.title,
            w.description,
            w.start_at,
            w.end_at,
            w.location,
            w.capacity,
            w.type,
            w.status,
            w.image_url,
            COUNT(DISTINCT wi.instructor_id) AS instructor_count
        FROM workshops AS w
        LEFT JOIN workshop_instructors AS wi
            ON wi.workshop_id = w.id
        GROUP BY
            w.id,
            w.title,
            w.description,
            w.start_at,
            w.end_at,
            w.location,
            w.capacity,
            w.type,
            w.status,
            w.image_url
        ORDER BY w.start_at DESC
    ";

    $workshops = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(200, [
        "success" => true,
        "data" => [
            "workshops" => $workshops
        ]
    ]);

} catch (Throwable $e) {
    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to load workshops."
    ]);
}
