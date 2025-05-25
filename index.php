<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Video Chatbot</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- jQuery CDN -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-800">Course Video Assistant</h1>
                <p class="text-gray-600">Ask me anything about our course videos</p>
            </div>

            <!-- Chat Container -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <!-- Chat Messages -->
                <div id="chat-messages" class="h-96 overflow-y-auto mb-4 space-y-4">
                    <!-- Welcome Message -->
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <span class="text-white text-sm">AI</span>
                            </div>
                        </div>
                        <div class="ml-3 bg-blue-100 rounded-lg p-3">
                            <p class="text-gray-800">Hello! I'm your course video assistant. How can I help you today?</p>
                        </div>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="flex items-center space-x-4">
                    <input type="text" id="user-input" 
                           class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                           placeholder="Type your message here...">
                    <button id="send-button" 
                            class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        Send
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Custom JavaScript -->
    <script src="assets/js/chat.js"></script>
</body>
</html> 