<?php

require_once __DIR__ . "/../auth/api_init.php";

require_once __DIR__ . "/../../config/Database.php";
require_once __DIR__ . "/../../repositories/WorkshopRepository.php";
require_once __DIR__ . "/../../controllers/WorkshopController.php";

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);

    exit;
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $repository = new WorkshopRepository($pdo);
    $controller = new WorkshopController($repository);

    if (isset($_GET["id"])) {
        $id = trim($_GET["id"]);

        if ($id === "") {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "Workshop ID is required"
            ]);

            exit;
        }

        $workshop = $controller->show($id);

        if ($workshop === false) {
            http_response_code(404);

            echo json_encode([
                "success" => false,
                "message" => "Workshop not found"
            ]);

            exit;
        }

        echo json_encode([
            "success" => true,
            "data" => $workshop
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    $workshops = $controller->index();

    echo json_encode([
        "success" => true,
        "data" => $workshops
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);

    error_log($e->__toString());

    echo json_encode([
        "success" => false,
        "message" => "An internal server error occurred"
    ], JSON_UNESCAPED_UNICODE);
}
?>
