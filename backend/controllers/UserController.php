<?php

require_once __DIR__ . "/../repositories/UserRepository.php";

class UserController
{
    private UserRepository $users;

    public function __construct(PDO $pdo)
    {
        $this->users = new UserRepository($pdo);
    }

    public function getProfile(string $userId): array|false
    {
        return $this->users->getById($userId);
    }

    public function updateProfile(string $userId, array $data): array
    {
        $firstName = trim($data["first_name"] ?? "");
        $lastName = trim($data["last_name"] ?? "");
        $email = trim($data["email"] ?? "");
        $phone = trim($data["phone"] ?? "");
        $gender = $data["gender"] ?? "";
        $birthDate = $data["birth_date"] ?? null;
        $location = trim($data["location"] ?? "");

        if (
            $firstName === "" ||
            $lastName === "" ||
            $email === "" ||
            $phone === ""
        ) {
            return [
                "success" => false,
                "status" => 422,
                "message" => "Name, email and phone are required."
            ];
        }

        if (
            !filter_var($email, FILTER_VALIDATE_EMAIL) ||
            strlen($firstName) > 100 ||
            strlen($lastName) > 100 ||
            strlen($email) > 255 ||
            strlen($phone) > 20 ||
            strlen($location) > 255
        ) {
            return [
                "success" => false,
                "status" => 422,
                "message" => "Please check the entered information."
            ];
        }

        if (!in_array($gender, ["male", "female"], true)) {
            return [
                "success" => false,
                "status" => 422,
                "message" => "Invalid gender."
            ];
        }

        if ($birthDate === "") {
            $birthDate = null;
        }

        if ($birthDate !== null) {
            if (!is_string($birthDate)) {
                return [
                    "success" => false,
                    "status" => 422,
                    "message" => "Invalid birth date."
                ];
            }

            $date = DateTime::createFromFormat("!Y-m-d", $birthDate);

            if (!$date || $date->format("Y-m-d") !== $birthDate) {
                return [
                    "success" => false,
                    "status" => 422,
                    "message" => "Invalid birth date."
                ];
            }
        }

        if ($this->users->emailExists($email, $userId)) {
            return [
                "success" => false,
                "status" => 409,
                "message" => "This email is already in use."
            ];
        }

        $this->users->update($userId, [
            "first_name" => $firstName,
            "last_name" => $lastName,
            "email" => $email,
            "phone" => $phone,
            "gender" => $gender,
            "birth_date" => $birthDate,
            "location" => $location === "" ? null : $location
        ]);

        $updatedUser = $this->users->getById($userId);

        return [
            "success" => true,
            "status" => 200,
            "message" => "Profile updated successfully.",
            "data" => $updatedUser
        ];
    }
}