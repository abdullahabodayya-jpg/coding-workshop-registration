<?php

$allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost",
    "http://127.0.0.1"
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
error_log("ATHAR API Origin: " . ($origin ?: "(empty)"));

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if (
    $origin !== "" &&
    !in_array($origin, $allowedOrigins, true)
) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Origin not allowed.",
        "received_origin" => $origin
    ]);
    exit;
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        "httponly" => true,
        "secure" => false, // Local XAMPP over HTTP only.
        "samesite" => "Lax",
        "path" => "/"
    ]);

    session_start();
}

function jsonResponse(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function requireMethod(string $method): void
{
    if ($_SERVER["REQUEST_METHOD"] !== $method) {
        header("Allow: " . $method . ", OPTIONS");

        jsonResponse(405, [
            "success" => false,
            "message" => "Method not allowed."
        ]);
    }
}

function readJsonBody(): array
{
    $rawBody = file_get_contents("php://input");
    $data = json_decode($rawBody, true);

    if (!is_array($data)) {
        jsonResponse(400, [
            "success" => false,
            "message" => "Invalid JSON request body."
        ]);
    }

    return $data;
}