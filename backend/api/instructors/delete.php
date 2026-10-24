
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

    $database = new Database();
    $pdo = $database->connect();

    $pdo->beginTransaction();

    $check = $pdo->prepare("
        SELECT id
        FROM instructors
        WHERE id = :id
        FOR UPDATE
    ");
    $check->execute(["id" => $id]);

    if (!$check->fetch(PDO::FETCH_ASSOC)) {
        $pdo->rollBack();

        jsonResponse(404, [
            "success" => false,
            "message" => "Instructor not found."
        ]);
    }

    $linkedWorkshops = $pdo->prepare("
        SELECT COUNT(*)
        FROM workshop_instructors
        WHERE instructor_id = :id
    ");
    $linkedWorkshops->execute(["id" => $id]);

    if ((int) $linkedWorkshops->fetchColumn() > 0) {
        $pdo->rollBack();

        jsonResponse(409, [
            "success" => false,
            "message" =>
                "This instructor is assigned to workshops. Remove the workshop assignments before deleting the instructor."
        ]);
    }

    $delete = $pdo->prepare("
        DELETE FROM instructors
        WHERE id = :id
    ");
    $delete->execute(["id" => $id]);

    $pdo->commit();

    jsonResponse(200, [
        "success" => true,
        "message" => "Instructor deleted successfully."
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to delete instructor."
    ]);
}
