<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'course_chatbot');

// Application configuration
define('SITE_URL', 'http://localhost/course-chatbot');
define('CHAT_HISTORY_LIMIT', 50);

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Chatbot configuration
define('CHATBOT_URL', 'https://backend1.brainovo.com/api');

// Create database connection
function getDBConnection() {
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
            DB_USER,
            DB_PASS,
            array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
        );
        return $conn;
    } catch(PDOException $e) {
        error_log("Connection failed: " . $e->getMessage());
        return null;
    }
}

// Helper function to send JSON response
function sendJSONResponse($data, $status = 200) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Helper function to handle errors
function handleError($message, $status = 400) {
    sendJSONResponse(['error' => $message], $status);
}
?> 