
<?php

class UserRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Find a user by email for login and registration.
    public function findByEmail(string $email): array|false
    {
        $sql = "
            SELECT *
            FROM users
            WHERE email = :email
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(["email" => $email]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Create a new user account.
    public function create(array $data): bool
    {
        $sql = "
            INSERT INTO users (
                first_name,
                last_name,
                email,
                phone,
                password_hash,
                gender,
                birth_date,
                location
            ) VALUES (
                :first_name,
                :last_name,
                :email,
                :phone,
                :password_hash,
                :gender,
                :birth_date,
                :location
            )
        ";

        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute([
            "first_name"    => $data["first_name"],
            "last_name"     => $data["last_name"],
            "email"         => $data["email"],
            "phone"         => $data["phone"],
            "password_hash" => $data["password_hash"],
            "gender"        => $data["gender"],
            "birth_date"    => $data["birth_date"],
            "location"      => $data["location"]
        ]);
    }

    // Get profile data without exposing the password hash.
    public function getById(string $id): array|false
    {
        $sql = "
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                role,
                gender,
                birth_date,
                location,
                status,
                created_at
            FROM users
            WHERE id = :id
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(["id" => $id]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Update profile information.
    public function update(string $id, array $data): bool
    {
        $sql = "
            UPDATE users
            SET
                first_name = :first_name,
                last_name = :last_name,
                email = :email,
                phone = :phone,
                gender = :gender,
                birth_date = :birth_date,
                location = :location
            WHERE id = :id
        ";

        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute([
            "first_name" => $data["first_name"],
            "last_name"  => $data["last_name"],
            "email"      => $data["email"],
            "phone"      => $data["phone"],
            "gender"     => $data["gender"],
            "birth_date" => $data["birth_date"],
            "location"   => $data["location"],
            "id"         => $id
        ]);
    }

    // Check whether another user already uses this email.
    public function emailExists(
        string $email,
        string $excludeUserId
    ): bool {
        $sql = "
            SELECT 1
            FROM users
            WHERE email = :email
              AND id != :id
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);

        $stmt->execute([
            "email" => $email,
            "id" => $excludeUserId
        ]);

        return $stmt->fetchColumn() !== false;
    }
}
