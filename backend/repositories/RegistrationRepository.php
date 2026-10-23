<?php

class RegistrationRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Check whether the user already has a registration
    public function findByUserAndWorkshop(
        string $userId,
        string $workshopId
    ): array|false {
        $sql = "
            SELECT id, status
            FROM registrations
            WHERE user_id = :user_id
              AND workshop_id = :workshop_id
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            "user_id" => $userId,
            "workshop_id" => $workshopId
        ]);

        return $stmt->fetch();
    }

    // Create a new registration
    public function create(
        string $userId,
        string $workshopId
    ): bool {
        $sql = "
            INSERT INTO registrations (user_id, workshop_id)
            VALUES (:user_id, :workshop_id)
        ";

        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute([
            "user_id" => $userId,
            "workshop_id" => $workshopId
        ]);
    }

    // Reactivate a previously cancelled registration
    public function reactivate(string $registrationId): bool
    {
        $sql = "
            UPDATE registrations
            SET status = 'confirmed'
            WHERE id = :id
        ";

        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute(["id" => $registrationId]);
    }

    // Count confirmed registrations
    public function countConfirmed(string $workshopId): int
    {
        $sql = "
            SELECT COUNT(*)
            FROM registrations
            WHERE workshop_id = :workshop_id
              AND status = 'confirmed'
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(["workshop_id" => $workshopId]);

        return (int) $stmt->fetchColumn();
    }

    public function cancel(string $registrationId): void
            {
                $sql = "
                    UPDATE registrations
                    SET status = 'cancelled'
                    WHERE id = :id
                    AND status = 'confirmed'
                ";

                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    "id" => $registrationId
                ]);
            }
}