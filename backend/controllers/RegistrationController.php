<?php

require_once __DIR__ . "/../repositories/RegistrationRepository.php";
require_once __DIR__ . "/../repositories/WorkshopRepository.php";

class RegistrationController
{
    private PDO $pdo;
    private RegistrationRepository $registrations;
    private WorkshopRepository $workshops;

    public function __construct(
        PDO $pdo,
        RegistrationRepository $registrations,
        WorkshopRepository $workshops
    ) {
        $this->pdo = $pdo;
        $this->registrations = $registrations;
        $this->workshops = $workshops;
    }

    public function register(
        string $userId,
        string $workshopId
    ): array {
        $this->pdo->beginTransaction();

        try {
            // Confirm that the workshop exists and is published.
            // Lock its row while checking available seats.
            $stmt = $this->pdo->prepare("
                SELECT id, capacity
                FROM workshops
                WHERE id = :id
                  AND status = 'published'
                LIMIT 1
                FOR UPDATE
            ");

            $stmt->execute(["id" => $workshopId]);
            $workshop = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$workshop) {
                $this->pdo->rollBack();

                return [
                    "status" => 404,
                    "message" => "Workshop not found."
                ];
            }

            $existing = $this->registrations->findByUserAndWorkshop(
                $userId,
                $workshopId
            );

            if ($existing && $existing["status"] === "confirmed") {
                $this->pdo->rollBack();

                return [
                    "status" => 409,
                    "message" => "You are already registered for this workshop."
                ];
            }

            $confirmedCount = $this->registrations->countConfirmed(
                $workshopId
            );

            if ($confirmedCount >= (int) $workshop["capacity"]) {
                $this->pdo->rollBack();

                return [
                    "status" => 409,
                    "message" => "This workshop is full."
                ];
            }

            if ($existing) {
                $this->registrations->reactivate($existing["id"]);
            } else {
                $this->registrations->create($userId, $workshopId);
            }

            $this->pdo->commit();

            return [
                "status" => 201,
                "message" => "You have successfully registered for the workshop."
            ];

        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $e;
        }
    }

    public function getStatus(
    string $userId,
    string $workshopId
): array {
    $stmt = $this->pdo->prepare("
        SELECT capacity
        FROM workshops
        WHERE id = :id
          AND status = 'published'
        LIMIT 1
    ");

    $stmt->execute(["id" => $workshopId]);
    $workshop = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$workshop) {
        return [
            "status" => 404,
            "message" => "Workshop not found."
        ];
    }

    $registered = $this->registrations->findByUserAndWorkshop(
        $userId,
        $workshopId
    );

    $confirmedCount = $this->registrations->countConfirmed($workshopId);
    $capacity = (int) $workshop["capacity"];

    return [
        "status" => 200,
        "registered" => $registered !== false
            && $registered["status"] === "confirmed",
        "capacity" => $capacity,
        "remaining_seats" => max(0, $capacity - $confirmedCount)
    ];
}

public function cancelRegistration(
    string $userId,
    string $workshopId
): array {
    $existing = $this->registrations->findByUserAndWorkshop(
        $userId,
        $workshopId
    );

    if (!$existing || $existing["status"] !== "confirmed") {
        return [
            "status" => 404,
            "message" => "No active registration found."
        ];
    }

    $this->registrations->cancel($existing["id"]);

    return [
        "status" => 200,
        "message" => "Your registration has been cancelled."
    ];
}
}