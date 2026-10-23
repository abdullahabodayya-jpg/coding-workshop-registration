<?php

require_once __DIR__ . "/api_init.php";

requireMethod("POST");

$_SESSION = [];

if (ini_get("session.use_cookies")) {
    $cookie = session_get_cookie_params();

    setcookie(session_name(), "", [
        "expires" => time() - 42000,
        "path" => $cookie["path"],
        "domain" => $cookie["domain"],
        "secure" => $cookie["secure"],
        "httponly" => $cookie["httponly"],
        "samesite" => $cookie["samesite"] ?? "Lax"
    ]);
}

session_destroy();

jsonResponse(200, [
    "success" => true,
    "message" => "You have been logged out."
]);