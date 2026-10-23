<?php

require_once __DIR__ . "/../repositories/UserRepository.php";

class AuthController
{
    private UserRepository $users;

    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }

    public function register(array $data): array
    {
        $firstName = trim($data["first_name"] ?? "");
        $lastName = trim($data["last_name"] ?? "");
        $email = strtolower(trim($data["email"] ?? ""));
        $phone = trim($data["phone"] ?? "");
        $password = $data["password"] ?? "";
        $confirmPassword = $data["confirm_password"] ?? "";
        $gender = $data["gender"] ?? "";
        $birthDate = trim($data["birth_date"] ?? "");
        $location = trim($data["location"] ?? "");

        if (
            $firstName === "" ||
            $lastName === "" ||
            $email === "" ||
            $phone === "" ||
            $password === "" ||
            $confirmPassword === "" ||
            $gender === ""
        ) {
            return [
                "status" => 422,
                "message" => "Please fill in all required fields."
            ];
        }

        if (
            mb_strlen($firstName) > 100 ||
            mb_strlen($lastName) > 100 ||
            mb_strlen($email) > 255 ||
            mb_strlen($phone) > 20 ||
            mb_strlen($location) > 255
        ) {
            return [
                "status" => 422,
                "message" => "One or more fields exceed the allowed length."
            ];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                "status" => 422,
                "message" => "Please enter a valid email address."
            ];
        }

        if (strlen($password) < 8) {
            return [
                "status" => 422,
                "message" => "Password must contain at least 8 characters."
            ];
        }

        if ($password !== $confirmPassword) {
            return [
                "status" => 422,
                "message" => "Passwords do not match."
            ];
        }

        if (!in_array($gender, ["male", "female"], true)) {
            return [
                "status" => 422,
                "message" => "Please select a valid gender."
            ];
        }

        if ($birthDate !== "") {
            $date = DateTime::createFromFormat("!Y-m-d", $birthDate);
            $dateErrors = DateTime::getLastErrors();

            $validDate = $date !== false
                && $date->format("Y-m-d") === $birthDate
                && ($dateErrors === false
                    || ($dateErrors["warning_count"] === 0
                        && $dateErrors["error_count"] === 0))
                && $birthDate <= date("Y-m-d");

            if (!$validDate) {
                return [
                    "status" => 422,
                    "message" => "Please enter a valid birth date."
                ];
            }
        }

        if ($this->users->findByEmail($email) !== false) {
            return [
                "status" => 409,
                "message" => "An account with this email already exists."
            ];
        }

        $user = [
            "first_name" => $firstName,
            "last_name" => $lastName,
            "email" => $email,
            "phone" => $phone,
            "password_hash" => password_hash($password, PASSWORD_DEFAULT),
            "gender" => $gender,
            "birth_date" => $birthDate !== "" ? $birthDate : null,
            "location" => $location !== "" ? $location : null
        ];

        try {
            $this->users->create($user);
        } catch (PDOException $e) {
            // MySQL duplicate-key error; protects against concurrent requests.
            if ($e->getCode() === "23000") {
                return [
                    "status" => 409,
                    "message" => "An account with this email already exists."
                ];
            }

            throw $e;
        }

        return [
            "status" => 201,
            "message" => "Your account has been created. You can now log in."
        ];
    }

    public function login(array $data): array
    {
        $email = strtolower(trim($data["email"] ?? ""));
        $password = $data["password"] ?? "";

        if ($email === "" || $password === "") {
            return [
                "status" => 422,
                "message" => "Email and password are required."
            ];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                "status" => 422,
                "message" => "Please enter a valid email address."
            ];
        }

        $user = $this->users->findByEmail($email);

        if (
            $user === false ||
            !password_verify($password, $user["password_hash"])
        ) {
            return [
                "status" => 401,
                "message" => "Invalid email or password."
            ];
        }

        if ($user["status"] !== "active") {
            return [
                "status" => 403,
                "message" => "This account is not active."
            ];
        }

        if (!session_regenerate_id(true)) {
            throw new RuntimeException("Could not regenerate session ID.");
        }

        $_SESSION["user_id"] = $user["id"];
        $_SESSION["user_role"] = $user["role"];
        $_SESSION["user_name"] = $user["first_name"] . " " . $user["last_name"];

        return [
            "status" => 200,
            "message" => "Login successful.",
            "data" => [
                "id" => $user["id"],
                "first_name" => $user["first_name"],
                "last_name" => $user["last_name"],
                "email" => $user["email"],
                "role" => $user["role"]
            ]
        ];
    }
}