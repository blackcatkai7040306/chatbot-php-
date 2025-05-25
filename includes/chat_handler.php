<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$message = isset($input['message']) ? trim($input['message']) : '';

if (empty($message)) {
    echo json_encode(['error' => 'Message is required']);
    exit;
}

// Store the user message in the database
try {
    $stmt = $pdo->prepare("INSERT INTO chat_messages (message, sender, created_at) VALUES (?, 'user', NOW())");
    $stmt->execute([$message]);
} catch(PDOException $e) {
    // Log error but continue with response
    error_log("Database error: " . $e->getMessage());
}

// Process the message and generate a response
$response = processMessage($message);

// Store the bot response in the database
try {
    $stmt = $pdo->prepare("INSERT INTO chat_messages (message, sender, created_at) VALUES (?, 'bot', NOW())");
    $stmt->execute([$response]);
} catch(PDOException $e) {
    error_log("Database error: " . $e->getMessage());
}

echo json_encode(['response' => $response]);

function processMessage($message) {
    // Convert message to lowercase for easier matching
    $message = strtolower($message);
    
    // Simple response logic - you can expand this based on your needs
    if (strpos($message, 'hello') !== false || strpos($message, 'hi') !== false) {
        return "Hello! How can I help you with our course videos today?";
    }
    
    if (strpos($message, 'video') !== false) {
        return "We have several course videos available. What specific topic are you interested in?";
    }
    
    if (strpos($message, 'help') !== false) {
        return "I can help you find information about our course videos. Just ask me about specific topics or courses you're interested in.";
    }
    
    // Default response
    return "I understand you're asking about: " . $message . ". Could you please provide more specific details about what you'd like to know about our course videos?";
}

const courseId = 38;
const lessonId = 8;
const userId = 210;
const CHATBOT_URL = 'localhost:8000/api';

async function storeMessage(content, senderId) {
    const message = {
        userid: userId,
        content: content,
        senderid: senderId,
        courseid: courseId,
        lessonid: lessonId,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(`${CHATBOT_URL}/chat/store`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
        });
        
        if (!response.ok) {
            throw new Error('Failed to store message');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error storing message:', error);
        throw error;
    }
}

async function fetchChatHistory() {
    try {
        const response = await fetch(`${CHATBOT_URL}/chat/history/${courseId}/${lessonId}/${userId}`);
        const data = await response.json();
        
        // Clear existing messages
        chatMessages.empty();
        
        // Add messages to chat
        data.forEach(message => {
            const isUser = message.senderid === 0;
            addMessage(message.content, isUser, message.timestamp);
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        addMessage('Error loading chat history. Please refresh the page.', false);
    }
}
?> 