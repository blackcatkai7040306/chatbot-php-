-- Create the database
CREATE DATABASE IF NOT EXISTS course_chatbot;

-- Use the database
USE course_chatbot;

-- Create the chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    content TEXT NOT NULL,
    senderid TINYINT NOT NULL COMMENT '0 for user, 1 for bot',
    courseid INT NOT NULL,
    lessonid INT NOT NULL,
    timestamp DATETIME NOT NULL,
    type VARCHAR(20) DEFAULT 'text' COMMENT 'text, video, lesson, file',
    video_url VARCHAR(255),
    video_title VARCHAR(255),
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size VARCHAR(50),
    file_url VARCHAR(255)
);

-- Create index for faster queries
CREATE INDEX idx_chat_lookup ON chat_messages(courseid, lessonid, userid); 