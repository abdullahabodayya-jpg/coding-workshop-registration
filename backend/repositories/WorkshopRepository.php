
<?php

require_once __DIR__ . "/../config/Database.php";

class WorkshopRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getPublishedWorkshops(): array
    {
        $sql = "
            SELECT
                id,
                title,
                description,
                start_at,
                end_at,
                location,
                capacity,
                type,
                status,
                image_url
            FROM workshops
            WHERE status = :status
            ORDER BY start_at ASC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            "status" => "published"
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPublishedWorkshopById(string $id): array|false
    {
        $sql = "
            SELECT
                w.id,
                w.title,
                w.description,
                w.start_at,
                w.end_at,
                w.location,
                w.capacity,
                w.type,
                w.status,
                w.image_url,

                i.id AS instructor_id,
                i.name AS instructor_name,
                i.description AS instructor_description,
                i.image_url AS instructor_image_url,
                i.main_link AS instructor_main_link

            FROM workshops AS w

            LEFT JOIN workshop_instructors AS wi
                ON w.id = wi.workshop_id

            LEFT JOIN instructors AS i
                ON wi.instructor_id = i.id

            WHERE w.id = :id
              AND w.status = :status

            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);

        $stmt->execute([
            "id" => $id,
            "status" => "published"
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
