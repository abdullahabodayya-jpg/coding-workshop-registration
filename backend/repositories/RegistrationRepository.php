<?php

class RegistrationRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

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

    public function getUserAccomplishments(string $userId): array
{
    $sql = "
        SELECT
            r.id AS registration_id,
            r.status AS registration_status,
            r.registered_at,
            w.id AS workshop_id,
            w.title,
            w.description,
            w.start_at,
            w.end_at,
            w.location,
            w.image_url,
            w.type,
            w.status AS workshop_status
        FROM registrations r
        INNER JOIN workshops w
            ON w.id = r.workshop_id
        WHERE r.user_id = :user_id
        ORDER BY
            CASE WHEN w.status = 'completed' THEN 0 ELSE 1 END,
            COALESCE(w.end_at, w.start_at) DESC,
            r.registered_at DESC
    ";

    $stmt = $this->pdo->prepare($sql);
    $stmt->execute(["user_id" => $userId]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
}