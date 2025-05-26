$(document).ready(function() {
    const chatMessages = $('#chat-messages');
    const userInput = $('#user-input');
    const sendButton = $('#send-button');

    // Static parameters
    const courseId = 38;
    const lessonId = 8;
    const userId = 210;
    const CHATBOT_URL = 'https://backend1.brainovo.com/api';
    const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9-5-eyJpc3MiOiJ5b3VyLWFwcGxpY2F0aW9uLW5hbWUiLCJpYXQiOjE3NDgxODU5NDcsImV4cCI6MTc0ODI3MjM0Nywic3ViIjoyMTAsInJvbGUiOiJlbXBsb3llZSIsImFwaSI6Nn0-5-rxLOpoUtMt5bbSXqGAlPlNddjUha5IEreO6XDYn0b8M";

    // Store messages in memory
    let messages = [];

    // Configure marked options
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    // Function to safely convert markdown to HTML
    function markdownToHtml(text) {
        // Escape any HTML in the text first
        const escapedText = text.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m];
        });
        return marked.parse(escapedText);
    }

    // Function to format timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    // Function to add a message to the chat
    function addMessage(message, isUser = false, timestamp = new Date().toISOString()) {
        const messageHtml = `
            <div class="flex items-start ${isUser ? 'justify-end' : ''}">
                ${!isUser ? `
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                            <span class="text-white text-sm font-medium">AI</span>
                        </div>
                    </div>
                ` : ''}
                <div class="${isUser ? 'mr-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'ml-3 bg-blue-50 text-gray-800'} rounded-2xl p-4 shadow-sm max-w-[80%]">
                    <div class="prose prose-sm ${isUser ? 'prose-invert' : ''} max-w-none">
                        ${isUser ? message : markdownToHtml(message)}
                    </div>
                    <span class="text-xs opacity-75 mt-1 block">${formatTimestamp(timestamp)}</span>
                </div>
                ${isUser ? `
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                            <span class="text-white text-sm font-medium">U</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        chatMessages.append(messageHtml);
        
        // Apply syntax highlighting to any code blocks
        chatMessages.find('pre code').each((i, block) => {
            hljs.highlightElement(block);
        });
        
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }

    // Function to fetch chat history
    async function fetchChatHistory() {
        try {
            const response = await fetch(`${CHATBOT_URL}/chat/history/${courseId}/${lessonId}/${userId}`);
            const data = await response.json();
            console.log(data.messages);
            
            // Clear existing messages
            chatMessages.empty();
            messages = []; // Reset messages array
            
            // Add messages to chat and store in messages array
            data.messages.forEach(message => {
                const isUser = message.senderid === 0;
                addMessage(message.content, isUser, message.timestamp);
                messages.push(message); // Store message in array
            });
        } catch (error) {
            console.error('Error fetching chat history:', error);
            addMessage('Error loading chat history. Please refresh the page.', false);
        }
    }

    // Function to fetch lessons by course ID
    async function fetchLessonsbyCourseID(token, courseId) {
        try {
            const apiurl = 'https://qa.brainovo.net';
            const completeUrl = `${apiurl}/route/${token}/trainingcourse/${courseId}/traininglesson?expand=owner&dataonly=true`;

            const response = await fetch(completeUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch lessons');
            }
            const apiData = await response.json();
            return apiData;
        } catch (error) {
            console.error('Error fetching lessons:', error);
            return [];
        }
    }

    // Function to get formatted lesson IDs
    async function getFormattedLessonIds(courseId) {
        try {
            const lessons = await fetchLessonsbyCourseID(token, courseId);
            return lessons.map(lesson => `${courseId}-${lesson.id}`);
        } catch (error) {
            console.error('Error fetching lessons:', error);
            return [];
        }
    }

    // Function to generate AI response
    async function generateAIResponse(userMessage) {
        console.log(userMessage);
        let fullResponse = '';
        const timestamp = new Date().toISOString();

        // Disable input and show loading state
        userInput.prop('disabled', true);
        sendButton.prop('disabled', true);
        sendButton.html(`
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `);

        try {
            // Get formatted lesson IDs
            const formattedLessonIds = await getFormattedLessonIds(courseId);

            const response = await fetch(`${CHATBOT_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.map(msg => ({
                        role: msg.senderid === 0 ? 'user' : 'assistant',
                        content: msg.content
                    })),
                    lesson_ids: formattedLessonIds
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from API');
            }

            // Add initial message container
            const messageHtml = `
                <div class="flex items-start bot-message">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                            <span class="text-white text-sm font-medium">AI</span>
                        </div>
                    </div>
                    <div class="ml-3 bg-blue-50 rounded-2xl p-4 shadow-sm max-w-[80%]">
                        <div class="prose prose-sm  max-w-none message-content"></div>
                        <span class="text-xs opacity-75 mt-1 block">${formatTimestamp(timestamp)}</span>
                    </div>
                </div>
            `;
            chatMessages.append(messageHtml);
            const messageContent = chatMessages.find('.message-content').last();

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let lastUpdate = Date.now();
            const updateInterval = 50; // Minimum time between updates in milliseconds

            // Function to update the message content
            const updateMessage = async (content) => {
                const now = Date.now();
                const timeSinceLastUpdate = now - lastUpdate;
                
                if (timeSinceLastUpdate < updateInterval) {
                    await new Promise(resolve => setTimeout(resolve, updateInterval - timeSinceLastUpdate));
                }
                
                // Update the content in place
                messageContent.html(markdownToHtml(content));
                
                // Apply syntax highlighting
                messageContent.find('pre code').each((i, block) => {
                    hljs.highlightElement(block);
                });
                
                chatMessages.scrollTop(chatMessages[0].scrollHeight);
                lastUpdate = Date.now();
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop() || '';

                for (const event of events) {
                    if (!event.startsWith('data: ')) continue;

                    const data = event.replace('data: ', '').trim();
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                        if (parsed.content) {
                            fullResponse += parsed.content;
                            await updateMessage(fullResponse);
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }
            }

            // Add final bot response to messages array
            const botResponse = {
                content: fullResponse,
                senderid: 1,
                courseid: courseId,
                lessonid: lessonId,
                userid: userId,
                timestamp,
                type: 'text'
            };
            messages.push(botResponse);

            return botResponse;

        } catch (error) {
            console.error('Error generating response:', error);
            const errorResponse = {
                content: 'I apologize, but I encountered an error while processing your message.',
                senderid: 1,
                courseid: courseId,
                lessonid: lessonId,
                userid: userId,
                timestamp: new Date().toISOString(),
                type: 'text'
            };
            messages.push(errorResponse);
            addMessage(errorResponse.content, false, errorResponse.timestamp);
            return errorResponse;
        } finally {
            // Re-enable input and restore send button
            userInput.prop('disabled', false);
            sendButton.prop('disabled', false);
            sendButton.html(`
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
            `);
            userInput.focus();
        }
    }
    

    // Function to send message
    async function sendMessage() {
        const content = userInput.val().trim();
        if (!content) return;

        const newMessage = {
            id: Date.now(),
            userid: userId,
            content: content,
            senderid: 0,
            courseid: courseId,
            lessonid: lessonId,
            timestamp: new Date().toISOString(),
            type: 'text'
        };

        // Add user message to chat and messages array
        addMessage(content, true);
        messages.push(newMessage);
        userInput.val('');

        // Generate and display bot response
        await generateAIResponse(newMessage);
    }

    // Event listeners
    sendButton.click(sendMessage);
    userInput.keypress(function(e) {
        if (e.which === 13) {
            sendMessage();
        }
    });

    // Quick suggestion buttons
    $('.quick-suggestion').click(function() {
        const suggestion = $(this).text();
        userInput.val(suggestion);
        sendMessage();
    });

    // Load chat history when page loads
    fetchChatHistory();

    // Focus input on load
    userInput.focus();
});