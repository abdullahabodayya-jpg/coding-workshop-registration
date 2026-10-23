
<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../config/Database.php";
require_once __DIR__ . "/../../repositories/RegistrationRepository.php";

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (empty($_SESSION["user_id"])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in first."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $repository = new RegistrationRepository($pdo);

    $registrations = $repository->getUserAccomplishments(
        (string) $_SESSION["user_id"]
    );

    $confirmedCount = 0;
    $completedCount = 0;

    foreach ($registrations as $registration) {
        if ($registration["registration_status"] === "confirmed") {
            $confirmedCount++;

            if ($registration["workshop_status"] === "completed") {
                $completedCount++;
            }
        }
    }

    http_response_code(200);

    echo json_encode([
        "success" => true,
        "data" => [
            "summary" => [
                "confirmed_registrations" => $confirmedCount,
                "completed_workshops" => $completedCount
            ],
            "registrations" => $registrations
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log($e->__toString());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to load your accomplishments."
    ], JSON_UNESCAPED_UNICODE);
}
