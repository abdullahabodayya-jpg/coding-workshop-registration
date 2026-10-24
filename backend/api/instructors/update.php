
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

function updateInstructorUrl(mixed $value, string $field): ?string
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
    $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

    if (
        strlen($value) > 2048 ||
        filter_var($value, FILTER_VALIDATE_URL) === false ||
        !in_array($scheme, ["http", "https"], true)
    ) {
        jsonResponse(422, [
            "success" => false,
            "message" => "{$field} must be a valid HTTP or HTTPS URL."
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

    $id = $input["id"] ?? null;
    $name = $input["name"] ?? null;
    $description = $input["description"] ?? null;

    if (
        !is_string($id) ||
        !preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $id
        )
    ) {
        jsonResponse(422, [
            "success" => false,
            "message" => "A valid instructor ID is required."
        ]);
    }

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

    $mainLink = updateInstructorUrl(
        $input["main_link"] ?? null,
        "Main link"
    );

    $imageUrl = updateInstructorUrl(
        $input["image_url"] ?? null,
        "Image URL"
    );

    $database = new Database();
    $pdo = $database->connect();

    $check = $pdo->prepare("
        SELECT id
        FROM instructors
        WHERE id = :id
        LIMIT 1
    ");
    $check->execute(["id" => $id]);

    if (!$check->fetch(PDO::FETCH_ASSOC)) {
        jsonResponse(404, [
            "success" => false,
            "message" => "Instructor not found."
        ]);
    }

    $statement = $pdo->prepare("
        UPDATE instructors
        SET
            name = :name,
            description = :description,
            main_link = :main_link,
            image_url = :image_url
        WHERE id = :id
    ");

    $statement->execute([
        "id" => $id,
        "name" => $name,
        "description" => $description,
        "main_link" => $mainLink,
        "image_url" => $imageUrl
    ]);

    jsonResponse(200, [
        "success" => true,
        "message" => "Instructor updated successfully."
    ]);
} catch (Throwable $e) {
    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to update instructor."
    ]);
}
