<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../config/Database.php";
require_once __DIR__ . "/../../controllers/UserController.php";

$method = $_SERVER["REQUEST_METHOD"];

if (!in_array($method, ["GET", "POST"], true)) {
    header("Allow: GET, POST, OPTIONS");

    jsonResponse(405, [
        "success" => false,
        "message" => "Method not allowed."
    ]);
}

if (empty($_SESSION["user_id"])) {
    jsonResponse(401, [
        "success" => false,
        "message" => "You are not logged in."
    ]);
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $controller = new UserController($pdo);
    $userId = (string) $_SESSION["user_id"];

    if ($method === "GET") {
        $user = $controller->getProfile($userId);

        if (!$user) {
            jsonResponse(404, [
                "success" => false,
                "message" => "User not found."
            ]);
        }

        jsonResponse(200, [
            "success" => true,
            "data" => $user
        ]);
    }

    $data = readJsonBody();
    $result = $controller->updateProfile($userId, $data);

    if (!$result["success"]) {
        jsonResponse($result["status"], [
            "success" => false,
            "message" => $result["message"]
        ]);
    }

    $_SESSION["user_name"] =
        $result["data"]["first_name"] . " " .
        $result["data"]["last_name"];

    jsonResponse(200, [
        "success" => true,
        "message" => $result["message"],
        "data" => $result["data"]
    ]);

} catch (PDOException $e) {
    error_log("User profile database error: " . $e->getMessage());

    if ($e->getCode() === "23000") {
        jsonResponse(409, [
            "success" => false,
            "message" => "This email is already in use."
        ]);
    }

    jsonResponse(500, [
        "success" => false,
        "message" => "A database error occurred."
    ]);

} catch (Throwable $e) {
    error_log("User profile API error: " . $e->getMessage());

    jsonResponse(500, [
        "success" => false,
        "message" => "An unexpected error occurred."
    ]);
}