<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../config/Database.php";
require_once __DIR__ . "/../../repositories/RegistrationRepository.php";
require_once __DIR__ . "/../../repositories/WorkshopRepository.php";
require_once __DIR__ . "/../../controllers/RegistrationController.php";

header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER["REQUEST_METHOD"];

if (!in_array($method, ["GET", "POST"], true)) {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

// Authentication check
if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Please log in first."
    ]);
    exit;
}

// GET reads from the URL; POST reads from JSON.
if ($method === "GET") {
    $workshopId = trim((string) ($_GET["workshop_id"] ?? ""));
} else {
    $input = [];
    $action = "register";

    if ($method === "GET") {
        $workshopId = trim((string) ($_GET["workshop_id"] ?? ""));
    } else {
        $input = json_decode(file_get_contents("php://input"), true) ?? [];

        $workshopId = trim((string) ($input["workshop_id"] ?? ""));
        $action = trim((string) ($input["action"] ?? "register"));
    }
}

if ($workshopId === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Workshop ID is required."
    ]);
    exit;
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $registrationRepository = new RegistrationRepository($pdo);
    $workshopRepository = new WorkshopRepository($pdo);

    $controller = new RegistrationController(
        $pdo,
        $registrationRepository,
        $workshopRepository
    );

    if ($method === "GET") {
        $result = $controller->getStatus(
            (string) $_SESSION["user_id"],
            $workshopId
        );

        http_response_code($result["status"]);

        echo json_encode([
            "success" => $result["status"] === 200,
            "data" => $result["status"] === 200 ? [
                "registered" => $result["registered"],
                "capacity" => $result["capacity"],
                "remaining_seats" => $result["remaining_seats"]
            ] : null,
            "message" => $result["message"] ?? null
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    // POST: register for a workshop
        if ($action === "cancel") {
            $result = $controller->cancelRegistration(
                (string) $_SESSION["user_id"],
                $workshopId
            );
        } elseif ($action === "register") {
            $result = $controller->register(
                (string) $_SESSION["user_id"],
                $workshopId
            );
        } else {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "Invalid action."
            ]);

            exit;
        }

    http_response_code($result["status"]);

    echo json_encode([
        "success" => in_array($result["status"], [200, 201], true),
        "message" => $result["message"]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log($e->__toString());

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "An internal server error occurred."
    ], JSON_UNESCAPED_UNICODE);
}