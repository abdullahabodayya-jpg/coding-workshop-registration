
<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("POST");

try {
    requireAdmin();

    $payload = readJsonBody();

    $id = trim((string)($payload["id"] ?? ""));
    $title = trim((string)($payload["title"] ?? ""));
    $description = trim((string)($payload["description"] ?? ""));
    $type = trim((string)($payload["type"] ?? ""));
    $status = trim((string)($payload["status"] ?? ""));
    $location = trim((string)($payload["location"] ?? ""));
    $imageUrl = trim((string)($payload["image_url"] ?? ""));

    $capacity = $payload["capacity"] ?? null;
    $startAt = $payload["start_at"] ?? null;
    $endAt = $payload["end_at"] ?? null;

    if ($id === "" || $title === "" || $description === "") {
        jsonResponse(422, [
            "success" => false,
            "message" => "ID, title and description are required."
        ]);
    }

    if (!in_array($status, ["draft", "published", "completed", "cancelled"], true)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Invalid workshop status."
        ]);
    }

    if (!in_array($type, ["online", "in_person", "hybrid"], true)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Invalid workshop type."
        ]);
    }

    if (
        $capacity === null ||
        filter_var($capacity, FILTER_VALIDATE_INT) === false ||
        (int)$capacity < 1
    ) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Capacity must be a positive integer."
        ]);
    }

    if (!$startAt || !$endAt) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Start and end dates are required."
        ]);
    }

    try {
        $start = new DateTimeImmutable((string)$startAt);
        $end = new DateTimeImmutable((string)$endAt);
    } catch (Throwable) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Invalid workshop date."
        ]);
    }

    if ($end <= $start) {
        jsonResponse(422, [
            "success" => false,
            "message" => "End date must be after start date."
        ]);
    }

    if ($imageUrl !== "" && !filter_var($imageUrl, FILTER_VALIDATE_URL)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Image URL is invalid."
        ]);
    }

    $database = new Database();
    $pdo = $database->connect();

    $statement = $pdo->prepare("
        UPDATE workshops
        SET
            title = :title,
            description = :description,
            type = :type,
            status = :status,
            location = :location,
            capacity = :capacity,
            start_at = :start_at,
            end_at = :end_at,
            image_url = :image_url
        WHERE id = :id
    ");

    $statement->execute([
        ":title" => $title,
        ":description" => $description,
        ":type" => $type,
        ":status" => $status,
        ":location" => $location !== "" ? $location : null,
        ":capacity" => (int)$capacity,
        ":start_at" => $start->format("Y-m-d H:i:s"),
        ":end_at" => $end->format("Y-m-d H:i:s"),
        ":image_url" => $imageUrl !== "" ? $imageUrl : null,
        ":id" => $id
    ]);

    $check = $pdo->prepare("SELECT id FROM workshops WHERE id = :id");
    $check->execute([":id" => $id]);

    if (!$check->fetchColumn()) {
        jsonResponse(404, [
            "success" => false,
            "message" => "Workshop not found."
        ]);
    }

    jsonResponse(200, [
        "success" => true,
        "message" => "Workshop updated successfully."
    ]);

} catch (Throwable $e) {
    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to update workshop."
    ]);
}
