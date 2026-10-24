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

$pdo = null;

try {
    requireAdmin();

    $payload = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (!is_array($payload)) {
        jsonResponse(400, [
            "success" => false,
            "message" => "Invalid JSON request."
        ]);
    }

    $title = trim($payload["title"] ?? "");
    $description = trim($payload["description"] ?? "");
    $type = $payload["type"] ?? "";
    $status = $payload["status"] ?? "draft";

    $location = trim($payload["location"] ?? "");
    $imageUrl = trim($payload["image_url"] ?? "");
    $agendaFile = trim($payload["agenda_file"] ?? "");

    $startAt = $payload["start_at"] ?? null;
    $endAt = $payload["end_at"] ?? null;
    $capacity = $payload["capacity"] ?? null;
    $instructorIds = $payload["instructor_ids"] ?? [];

    // Required fields.
    if ($title === "" || mb_strlen($title) > 200) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Title is required and must not exceed 200 characters."
        ]);
    }

    if ($description === "") {
        jsonResponse(422, [
            "success" => false,
            "message" => "Description is required."
        ]);
    }

    if (!in_array($type, ["online", "onsite"], true)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Choose a valid workshop type."
        ]);
    }

    if (!in_array($status, ["draft", "published"], true)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Invalid workshop status."
        ]);
    }

    // Location validation.
    if (mb_strlen($location) > 500) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Location must not exceed 500 characters."
        ]);
    }

    if ($type === "onsite" && $location === "") {
        jsonResponse(422, [
            "success" => false,
            "message" => "Location is required for onsite workshops."
        ]);
    }

    // Optional capacity.
    if ($capacity === "") {
        $capacity = null;
    }

    if (
        $capacity !== null &&
        (
            !is_int($capacity) ||
            $capacity < 1
        )
    ) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Capacity must be a positive whole number."
        ]);
    }

    // Date and time validation.
    if (
        ($startAt === null) !== ($endAt === null) ||
        ($startAt === "" && $endAt !== "") ||
        ($endAt === "" && $startAt !== "")
    ) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Provide both start and end date/time, or leave both empty."
        ]);
    }

    $startAt = $startAt === "" ? null : $startAt;
    $endAt = $endAt === "" ? null : $endAt;

    $parseDate = static function ($value): ?DateTimeImmutable {
        if ($value === null) {
            return null;
        }

        if (!is_string($value)) {
            return null;
        }

        $date = DateTimeImmutable::createFromFormat(
            "!Y-m-d\TH:i",
            $value
        );

        $errors = DateTimeImmutable::getLastErrors();

        if (
            $date === false ||
            (
                $errors !== false &&
                (
                    $errors["warning_count"] > 0 ||
                    $errors["error_count"] > 0
                )
            ) ||
            $date->format("Y-m-d\TH:i") !== $value
        ) {
            return null;
        }

        return $date;
    };

    $startDate = $parseDate($startAt);
    $endDate = $parseDate($endAt);

    if (
        ($startAt !== null && $startDate === null) ||
        ($endAt !== null && $endDate === null)
    ) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Invalid date or time."
        ]);
    }

    if (
        $startDate !== null &&
        $endDate !== null &&
        $endDate <= $startDate
    ) {
        jsonResponse(422, [
            "success" => false,
            "message" => "End date/time must be after start date/time."
        ]);
    }

    // Optional URLs.
    if (
        mb_strlen($imageUrl) > 500 ||
        (
            $imageUrl !== "" &&
            filter_var($imageUrl, FILTER_VALIDATE_URL) === false
        )
    ) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Enter a valid cover image URL."
        ]);
    }

    if (mb_strlen($agendaFile) > 500) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Agenda path must not exceed 500 characters."
        ]);
    }

    // Validate instructor IDs.
    if (!is_array($instructorIds)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Instructor selection is invalid."
        ]);
    }

    if (count($instructorIds) > 100) {
        jsonResponse(422, [
            "success" => false,
            "message" => "Too many instructors selected."
        ]);
    }

    foreach ($instructorIds as $id) {
        if (
            !is_string($id) ||
            !preg_match(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
                $id
            )
        ) {
            jsonResponse(422, [
                "success" => false,
                "message" => "One or more instructor IDs are invalid."
            ]);
        }
    }

    if (count(array_unique($instructorIds)) !== count($instructorIds)) {
        jsonResponse(422, [
            "success" => false,
            "message" => "An instructor cannot be selected more than once."
        ]);
    }

    // Connect to the database.
    $database = new Database();
    $pdo = $database->connect();

    $pdo->beginTransaction();

    // Verify that all selected instructors exist.
    if (count($instructorIds) > 0) {
        $placeholders = implode(
            ", ",
            array_fill(0, count($instructorIds), "?")
        );

        $check = $pdo->prepare("
            SELECT id
            FROM instructors
            WHERE id IN ($placeholders)
        ");

        $check->execute($instructorIds);

        $existingIds = $check->fetchAll(PDO::FETCH_COLUMN);

        if (count($existingIds) !== count($instructorIds)) {
            $pdo->rollBack();

            jsonResponse(422, [
                "success" => false,
                "message" => "One or more selected instructors no longer exist."
            ]);
        }
    }

    // Generate the UUID explicitly so we know the new workshop ID.
    $workshopId = $pdo->query("SELECT UUID()")->fetchColumn();

    if (!is_string($workshopId) || $workshopId === "") {
        throw new RuntimeException("Could not generate a workshop UUID.");
    }

    // Insert the workshop.
    $insertWorkshop = $pdo->prepare("
        INSERT INTO workshops (
            id,
            title,
            description,
            start_at,
            end_at,
            location,
            agenda_file,
            image_url,
            capacity,
            type,
            status
        ) VALUES (
            :id,
            :title,
            :description,
            :start_at,
            :end_at,
            :location,
            :agenda_file,
            :image_url,
            :capacity,
            :type,
            :status
        )
    ");

    $insertWorkshop->execute([
        ":id" => $workshopId,
        ":title" => $title,
        ":description" => $description,
        ":start_at" => $startDate?->format("Y-m-d H:i:s"),
        ":end_at" => $endDate?->format("Y-m-d H:i:s"),
        ":location" => $location !== "" ? $location : null,
        ":agenda_file" => $agendaFile !== "" ? $agendaFile : null,
        ":image_url" => $imageUrl !== "" ? $imageUrl : null,
        ":capacity" => $capacity,
        ":type" => $type,
        ":status" => $status
    ]);

    // Attach the selected instructors to the workshop.
    if (count($instructorIds) > 0) {
        $attachInstructor = $pdo->prepare("
            INSERT INTO workshop_instructors (
                workshop_id,
                instructor_id
            ) VALUES (
                :workshop_id,
                :instructor_id
            )
        ");

        foreach ($instructorIds as $instructorId) {
            $attachInstructor->execute([
                ":workshop_id" => $workshopId,
                ":instructor_id" => $instructorId
            ]);
        }
    }

    // Commit only after the workshop and its instructor links are saved.
    $pdo->commit();

    jsonResponse(201, [
        "success" => true,
        "message" => $status === "draft"
            ? "Workshop draft saved successfully."
            : "Workshop published successfully.",
        "data" => [
            "id" => $workshopId
        ]
    ]);

} catch (Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($e->__toString());

    jsonResponse(500, [
        "success" => false,
        "message" => "Unable to create the workshop."
    ]);
}

