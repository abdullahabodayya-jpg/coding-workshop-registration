<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("POST");

$data = readJsonBody();

$name = trim((string) ($data["name"] ?? ""));
$email = trim((string) ($data["email"] ?? ""));
$subject = trim((string) ($data["subject"] ?? ""));
$message = trim((string) ($data["message"] ?? ""));

$allowedSubjects = [
    "workshops",
    "registration",
    "account",
    "technical",
    "feedback",
    "other"
];

if (
    mb_strlen($name) < 2 ||
    mb_strlen($name) > 150 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($email) > 255 ||
    !in_array($subject, $allowedSubjects, true) ||
    mb_strlen($message) < 10 ||
    mb_strlen($message) > 3000
) {
    jsonResponse(422, [
        "success" => false,
        "message" => "Please check your submitted information."
    ]);
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->prepare("
        INSERT INTO contact_messages
            (name, email, subject, message)
        VALUES
            (:name, :email, :subject, :message)
    ");

    $stmt->execute([
        "name" => $name,
        "email" => $email,
        "subject" => $subject,
        "message" => $message
    ]);

    jsonResponse(201, [
        "success" => true,
        "message" => "Your message has been sent successfully."
    ]);

} catch (Throwable $e) {
    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to send your message right now."
    ]);
}