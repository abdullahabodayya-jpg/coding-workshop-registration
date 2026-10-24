<?php

require_once __DIR__ . "/../auth/api_init.php";
require_once __DIR__ . "/../../middleware/AdminMiddleware.php";
require_once __DIR__ . "/../../config/Database.php";

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);

    exit;
}

try {
    requireAdmin();

    $database = new Database();
    $pdo = $database->connect();

    
    $stats = $pdo->query("
            SELECT
                (SELECT COUNT(*) FROM users)
                    AS total_users,

                (SELECT COUNT(*) FROM workshops)
                    AS total_workshops,

                (SELECT COUNT(*) FROM registrations)
                    AS total_registrations,

                (SELECT COUNT(*) FROM instructors)
                    AS total_instructors,

                (SELECT COUNT(*)
                FROM contact_messages
                WHERE status = 'open')
                    AS open_messages,

                (SELECT COUNT(*)
                FROM contact_messages
                WHERE status = 'in_progress')
                    AS pending_messages
        ")->fetch(PDO::FETCH_ASSOC);
    
    $genderRows = $pdo->query("
        SELECT gender, COUNT(*) AS total
        FROM users
        GROUP BY gender
    ")->fetchAll();

    $gender = [
        "male" => 0,
        "female" => 0
    ];

    foreach ($genderRows as $row) {
        $gender[$row["gender"]] = (int) $row["total"];
    }

    
    $workshopRows = $pdo->query("
        SELECT status, COUNT(*) AS total
        FROM workshops
        GROUP BY status
    ")->fetchAll();

    $workshopStatuses = [
        "draft" => 0,
        "published" => 0,
        "completed" => 0,
        "cancelled" => 0
    ];

    foreach ($workshopRows as $row) {
        $workshopStatuses[$row["status"]] = (int) $row["total"];
    }


    $registrationsByWorkshop = $pdo->query("
        SELECT
            w.id,
            w.title,
            COUNT(r.id) AS total
        FROM workshops w
        LEFT JOIN registrations r
            ON r.workshop_id = w.id
            AND r.status = 'confirmed'
        GROUP BY w.id, w.title
        ORDER BY total DESC, w.title ASC
        LIMIT 8
    ")->fetchAll();

    $monthlyStatement = $pdo->query("
        SELECT
            DATE_FORMAT(months.month_start, '%Y-%m') AS month_key,
            DATE_FORMAT(months.month_start, '%b %Y') AS month_label,
            COUNT(r.id) AS total
        FROM (
            SELECT
                DATE_SUB(
                    DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'),
                    INTERVAL seq.month_offset MONTH
                ) AS month_start
            FROM (
                SELECT 0 AS month_offset
                UNION ALL SELECT 1
                UNION ALL SELECT 2
                UNION ALL SELECT 3
                UNION ALL SELECT 4
                UNION ALL SELECT 5
            ) AS seq
        ) AS months
        LEFT JOIN registrations r
            ON r.registered_at >= months.month_start
            AND r.registered_at < DATE_ADD(
                months.month_start,
                INTERVAL 1 MONTH
            )
        GROUP BY months.month_start
        ORDER BY months.month_start ASC
    ");

    $monthlyRegistrations = $monthlyStatement->fetchAll();

    
    $messageStatusRows = $pdo->query("
        SELECT status, COUNT(*) AS total
        FROM contact_messages
        GROUP BY status
    ")->fetchAll();

    $messageStatuses = [
        "open" => 0,
        "in_progress" => 0,
        "resolved" => 0
    ];

    foreach ($messageStatusRows as $row) {
        $messageStatuses[$row["status"]] = (int) $row["total"];
    }

    // Convert numeric results to integers.
    foreach ($stats as $key => $value) {
        $stats[$key] = (int) $value;
    }

    echo json_encode([
        "success" => true,
        "data" => [
            "stats" => $stats,
            "gender" => $gender,
            "workshop_statuses" => $workshopStatuses,
            "registrations_by_workshop" => array_map(
                static function (array $row): array {
                    return [
                        "id" => $row["id"],
                        "title" => $row["title"],
                        "total" => (int) $row["total"]
                    ];
                },
                $registrationsByWorkshop
            ),
            "monthly_registrations" => array_map(
                static function (array $row): array {
                    return [
                        "month" => $row["month_label"],
                        "total" => (int) $row["total"]
                    ];
                },
                $monthlyRegistrations
            ),
            "message_statuses" => $messageStatuses
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(
        $e instanceof PDOException ? 500 : 500
    );

    error_log($e->__toString());

    echo json_encode([
        "success" => false,
        "message" => "An internal server error occurred"
    ], JSON_UNESCAPED_UNICODE);
}