$(document).ready(function() {
    const chatMessages = $('#chat-messages');
    const userInput = $('#user-input');
    const sendButton = $('#send-button');

    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageHtml = `
            <div class="flex items-start ${isUser ? 'justify-end' : ''}">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full ${isUser ? 'bg-green-500' : 'bg-blue-500'} flex items-center justify-center">
                        <span class="text-white text-sm">${isUser ? 'U' : 'AI'}</span>
                    </div>
                </div>
                <div class="ml-3 ${isUser ? 'bg-green-100' : 'bg-blue-100'} rounded-lg p-3">
                    <p class="text-gray-800">${message}</p>
                </div>
            </div>
        `;
        chatMessages.append(messageHtml);
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }

    // Function to send message to server
    function sendMessage() {
        const message = userInput.val().trim();
        if (message === '') return;

        // Add user message to chat
        addMessage(message, true);
        userInput.val('');

        // Send message to server
        $.ajax({
            url: 'includes/chat_handler.php',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ message: message }),
            success: function(response) {
                if (response.error) {
                    addMessage('Sorry, there was an error processing your message.');
                } else {
                    addMessage(response.response);
                }
            },
            error: function() {
                addMessage('Sorry, there was an error connecting to the server.');
            }
        });
    }

    // Event listeners
    sendButton.click(sendMessage);
    userInput.keypress(function(e) {
        if (e.which === 13) {
            sendMessage();
        }
    });

    // Focus input on load
    userInput.focus();
}); 