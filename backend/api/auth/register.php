<?php

require_once __DIR__ . "/api_init.php";

requireMethod("POST");

require_once __DIR__ . "/../../config/Database.php";
require_once __DIR__ . "/../../repositories/UserRepository.php";
require_once __DIR__ . "/../../controllers/AuthController.php";

try {
    $database = new Database();
    $repository = new UserRepository($database->connect());
    $controller = new AuthController($repository);

    $result = $controller->register(readJsonBody());

    $status = $result["status"];
    unset($result["status"]);

    jsonResponse($status, [
        "success" => $status === 201,
        ...$result
    ]);
} catch (Throwable $e) {
    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "A server error occurred. Please try again."
    ]);
}
?>