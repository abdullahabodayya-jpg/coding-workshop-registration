<?php

class UserRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Find a user by email for registration and login.
    public function findByEmail(string $email): array|false
    {
        $sql = "
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                password_hash,
                role,
                status
            FROM users
            WHERE email = :email
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            "email" => $email
        ]);

        return $stmt->fetch();
    }

    // Create a new participant account.
    public function create(array $user): bool
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
            "first_name" => $user["first_name"],
            "last_name" => $user["last_name"],
            "email" => $user["email"],
            "phone" => $user["phone"],
            "password_hash" => $user["password_hash"],
            "gender" => $user["gender"],
            "birth_date" => $user["birth_date"],
            "location" => $user["location"]
        ]);
    }
}
?>