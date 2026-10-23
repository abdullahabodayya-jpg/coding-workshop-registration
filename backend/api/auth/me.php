<?php

require_once __DIR__ . "/api_init.php";

requireMethod("GET");

if (!isset($_SESSION["user_id"])) {
    jsonResponse(401, [
        "success" => false,
        "message" => "You are not logged in."
    ]);
}

jsonResponse(200, [
    "success" => true,
    "data" => [
        "id" => $_SESSION["user_id"],
        "role" => $_SESSION["user_role"],
        "name" => $_SESSION["user_name"]
    ]
]);