<?php

require_once __DIR__ . "/../api/auth/api_init.php";

function requireAdmin(): void
{
    if (!isset($_SESSION["user_id"])) {
        jsonResponse(401, [
            "success" => false,
            "message" => "Authentication required."
        ]);
    }

    if (($_SESSION["user_role"] ?? null) !== "admin") {
        jsonResponse(403, [
            "success" => false,
            "message" => "Admin access required."
        ]);
    }
}