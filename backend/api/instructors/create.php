
<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST");
    jsonResponse(405, [
        "success" => false,
        "message" => "Method not allowed."
    ]);
}

function createInstructorUuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

    $hex = bin2hex($bytes);

    return sprintf(
        "%s-%s-%s-%s-%s",
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20, 12)
    );
}

function instructorInputUrl(mixed $value, string $field): ?string
{
    if ($value === null || $value === "") {
        return null;
    }

    if (!is_string($value)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Invalid value for {$field}."
        ]);
    }

    $value = trim($value);

    if (
        strlen($value) > 2048 ||
        filter_var($value, FILTER_VALIDATE_URL) === false
    ) {
        jsonResponse(422, [
            "success" => false,
            "message" => "{$field} must be a valid HTTP or HTTPS URL."
        ]);
    }

    $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

    if (!in_array($scheme, ["http", "https"], true)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "{$field} must use HTTP or HTTPS."
        ]);
    }

    return $value;
}

try {
    requireAdmin();

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        jsonResponse(400, [
            "success" => false,
            "message" => "Invalid JSON body."
        ]);
    }

    $name = $input["name"] ?? null;
    $description = $input["description"] ?? null;

    if (!is_string($name) || trim($name) === "") {
        jsonResponse(422, [
            "success" => false,
            "message" => "Instructor name is required."
        ]);
    }

    $name = trim($name);

    if (mb_strlen($name) > 150) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Instructor name must not exceed 150 characters."
        ]);
    }

    if ($description !== null && !is_string($description)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Description must be text."
        ]);
    }

    $description = $description === null ? null : trim($description);

    $mainLink = instructorInputUrl(
        $input["main_link"] ?? null,
        "Main link"
    );

    $imageUrl = instructorInputUrl(
        $input["image_url"] ?? null,
        "Image URL"
    );

    $database = new Database();
    $pdo = $database->connect();

    $id = createInstructorUuid();

    $statement = $pdo->prepare("
        INSERT INTO instructors
            (id, name, description, main_link, image_url)
        VALUES
            (:id, :name, :description, :main_link, :image_url)
    ");

    $statement->execute([
        "id" => $id,
        "name" => $name,
        "description" => $description,
        "main_link" => $mainLink,
        "image_url" => $imageUrl
    ]);

    jsonResponse(201, [
        "success" => true,
        "message" => "Instructor created successfully.",
        "data" => [
            "id" => $id
        ]
    ]);
} catch (Throwable $e) {
    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to create instructor."
    ]);
}
