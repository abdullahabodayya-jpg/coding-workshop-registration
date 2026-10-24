
<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

requireMethod("POST");
requireAdmin();

$data = readJsonBody();

$firstName = trim($data["first_name"] ?? "");
$lastName = trim($data["last_name"] ?? "");
$email = strtolower(trim($data["email"] ?? ""));
$phone = trim($data["phone"] ?? "");
$password = $data["password"] ?? "";

if (
    $firstName === "" ||
    $lastName === "" ||
    $email === "" ||
    !is_string($password)
) {
    jsonResponse(422, [
        "success" => false,
        "message" => "First name, last name, email and password are required."
    ]);
}

if (
    mb_strlen($firstName) > 100 ||
    mb_strlen($lastName) > 100 ||
    mb_strlen($email) > 255 ||
    mb_strlen($phone) > 30
) {
    jsonResponse(422, [
        "success" => false,
        "message" => "One or more fields exceed the allowed length."
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(422, [
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);
}

if (strlen($password) < 12 || strlen($password) > 72) {
    jsonResponse(422, [
        "success" => false,
        "message" => "Password must be between 12 and 72 bytes."
    ]);
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $check = $pdo->prepare("
        SELECT id
        FROM users
        WHERE email = :email
        LIMIT 1
    ");

    $check->execute(["email" => $email]);

    if ($check->fetch(PDO::FETCH_ASSOC)) {
        jsonResponse(409, [
            "success" => false,
            "message" => "An account with this email already exists."
        ]);
    }

    $id = $pdo->query("SELECT UUID()")->fetchColumn();
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    if ($passwordHash === false) {
        throw new RuntimeException("Password hashing failed.");
    }

    $stmt = $pdo->prepare("
        INSERT INTO users (
            id,
            first_name,
            last_name,
            email,
            phone,
            password_hash,
            role,
            status,
            created_at,
            updated_at
        ) VALUES (
            :id,
            :first_name,
            :last_name,
            :email,
            :phone,
            :password_hash,
            'admin',
            'active',
            NOW(),
            NOW()
        )
    ");

    $stmt->execute([
        "id" => $id,
        "first_name" => $firstName,
        "last_name" => $lastName,
        "email" => $email,
        "phone" => $phone !== "" ? $phone : null,
        "password_hash" => $passwordHash
    ]);

    jsonResponse(201, [
        "success" => true,
        "message" => "Admin account created successfully.",
        "data" => [
            "id" => $id,
            "first_name" => $firstName,
            "last_name" => $lastName,
            "email" => $email,
            "role" => "admin",
            "status" => "active"
        ]
    ]);

} catch (PDOException $e) {
    error_log("Create admin database error: " . $e->getMessage());

    // Handles duplicate-email races and other database constraint errors.
    if ($e->getCode() === "23000") {
        jsonResponse(409, [
            "success" => false,
            "message" => "The email may already be registered, or a database constraint was violated."
        ]);
    }

    jsonResponse(500, [
        "success" => false,
        "message" => "Failed to create admin account."
    ]);

} catch (Throwable $e) {
    error_log("Create admin error: " . $e->getMessage());

    jsonResponse(500, [
        "success" => false,
        "message" => "Failed to create admin account."
    ]);
}
