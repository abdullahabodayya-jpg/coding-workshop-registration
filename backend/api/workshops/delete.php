<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("POST");

try {
    requireAdmin();

    $payload = readJsonBody();
    $id = trim((string)($payload["id"] ?? ""));

    if ($id === "") {
        jsonResponse(422, [
            "success" => false,
            "message" => "Workshop ID is required."
        ]);
    }

    $database = new Database();
    $pdo = $database->connect();

    $check = $pdo->prepare("
        SELECT id
        FROM workshops
        WHERE id = :id
    ");
    $check->execute([":id" => $id]);

    if (!$check->fetchColumn()) {
        jsonResponse(404, [
            "success" => false,
            "message" => "Workshop not found."
        ]);
    }

    $registrationCheck = $pdo->prepare("
        SELECT 1
        FROM registrations
        WHERE workshop_id = :id
        LIMIT 1
    ");
    $registrationCheck->execute([":id" => $id]);

    if ($registrationCheck->fetchColumn()) {
        jsonResponse(409, [
            "success" => false,
            "message" => "This workshop has registrations. Cancel or archive it instead."
        ]);
    }

    $pdo->beginTransaction();

    $detach = $pdo->prepare("
        DELETE FROM workshop_instructors
        WHERE workshop_id = :id
    ");
    $detach->execute([":id" => $id]);

    $delete = $pdo->prepare("
        DELETE FROM workshops
        WHERE id = :id
    ");
    $delete->execute([":id" => $id]);

    $pdo->commit();

    jsonResponse(200, [
        "success" => true,
        "message" => "Workshop deleted successfully."
    ]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to delete workshop."
    ]);
}
