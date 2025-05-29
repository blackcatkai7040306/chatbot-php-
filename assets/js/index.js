$(document).ready(function() {
    const chatMessages = $('#chat-messages');
    const chatOptions = $('#chat-options');
    const userInput = $('#user-input');
    const sendButton = $('#send-button');
    const chatForm = $('#chat-form');

    const courseId = window.courseId;
    const lessonId = window.lessonId;
    const userId = window.userId;
    const CHATBOT_URL = window.CHATBOT_URL;
    const APP_API_URL = window.APP_API_URL;
    const AUTH_TOKEN = window.AUTH_TOKEN;
    const lessonName = window.lessonName;
    const firstQuestion = window.firstQuestion;
    
    
    let messages = [];
    let questionMode = false;
    let currentQuestionIndex = 0;
    const botQuestions = [
        window.firstQuestion || "What are the main concepts covered in this lesson?",
        "Can you explain one of the key points in your own words?",
        "How would you apply what you learned in a real-world scenario?"
    ];

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


    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    // Function to add a message to the chat
    function addMessage(message, isUser = false, timestamp = new Date().toISOString(), isHtml = false) {
        const messageHtml = `
            <div class="flex items-start ${isUser ? 'justify-end' : ''}">
                ${!isUser ? `
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-[rgb(105,108,255)] flex items-center justify-center shadow-md">
                            <span class="text-white text-sm font-medium">AI</span>
                        </div>
                    </div>
                ` : ''}
                <div class="${isUser ? 'mr-3 bg-[rgb(105,108,255)] text-white' : 'ml-3 bg-[rgb(105,108,255)] text-white'} rounded-2xl p-4 shadow-sm max-w-[80%]">
                    <div class="prose prose-sm ${isUser ? 'prose-invert' : 'prose-invert'} max-w-none">
                        ${isHtml ? message : (isUser ? message : markdownToHtml(message))}
                    </div>
                    <span class="text-xs opacity-75 mt-1 block">${formatTimestamp(timestamp)}</span>
                </div>
                ${isUser ? `
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-[rgb(105,108,255)] flex items-center justify-center shadow-md">
                            <span class="text-white text-sm font-medium">U</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        chatMessages.append(messageHtml);
     
        chatMessages.find('pre code').each((i, block) => {
            hljs.highlightElement(block);
        });
        
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }

    // Function to disable/enable options
    function disableOption(optionId) {
        $(`#${optionId}`).addClass('disabled').off('click');
    }

    function enableOption(optionId, clickHandler) {
        $(`#${optionId}`).removeClass('disabled').off('click').on('click', clickHandler);
    }

    function disableAllOptions() {
        disableOption('fetch-history-card');
        disableOption('start-bot-card');
    }

    function enableAllOptions() {
        enableOption('fetch-history-card', function() {
            disableOption('fetch-history-card');
            fetchChatHistory();
        });
        enableOption('start-bot-card', function() {
            disableAllOptions();
            questionMode = true;
            currentQuestionIndex = 0;
            askNextQuestion();
        });
    }

    // Function to ask the next bot question
    function askNextQuestion() {
        if (currentQuestionIndex < botQuestions.length) {
            const questionText = `Question ${currentQuestionIndex + 1}/3: ${botQuestions[currentQuestionIndex]}`;
            addMessage(questionText, false);
            currentQuestionIndex++;
        } else {
            addMessage("Great job! You've completed all the questions. Feel free to ask me anything else about the lesson.", false);
            questionMode = false;
            currentQuestionIndex = 0;
            // Re-enable all options when questions are completed
            enableAllOptions();
        }
    }

    // Show only the welcome message as the first chat message
    chatMessages.empty();
    addMessage(
        `Welcome to Novo Bot, I am here to help you understand more about <span class='font-bold text-lg text-blue-200 bg-blue-700 px-2 py-1 rounded'>${lessonName}</span>. You can ask me questions to make sure you understand material. `,
        false,
        new Date().toISOString(),
        true
    );

    // Render two option cards below the chat messages
    chatOptions.html(`
        <div class="option-card" id="fetch-history-card">
            <div class="font-semibold text-base">Chat History</div>
        </div>
        <div class="option-card" id="start-bot-card">
            <div class="font-semibold text-base">Quiz Me</div>
        </div>
    `);

    // Initialize with all options enabled
    enableAllOptions();

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
    async function fetchLessonsbyCourseID(AUTH_TOKEN, courseId) {
        try {
            
            const completeUrl = `${APP_API_URL}/route/${AUTH_TOKEN}/trainingcourse/${courseId}/traininglesson?expand=owner&dataonly=true`;

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
            const lessons = await fetchLessonsbyCourseID(AUTH_TOKEN, courseId);
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

         
            const messageHtml = `
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-[rgb(105,108,255)] flex items-center justify-center shadow-md">
                            <span class="text-white text-sm font-medium">AI</span>
                        </div>
                    </div>
                    <div class="ml-3 bg-[rgb(105,108,255)] text-white rounded-2xl p-4 shadow-sm max-w-[80%]">   
                        <div class="prose prose-sm prose-invert max-w-none message-content"></div>
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

     
            const updateMessage = async (content) => {
                const now = Date.now();
                const timeSinceLastUpdate = now - lastUpdate;
                
                if (timeSinceLastUpdate < updateInterval) {
                    await new Promise(resolve => setTimeout(resolve, updateInterval - timeSinceLastUpdate));
                }
                
               
                messageContent.html(markdownToHtml(content));
                
                
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

        addMessage(content, true);
        messages.push(newMessage);
        userInput.val('');

        // If in question mode, ask next question instead of generating AI response
        if (questionMode && currentQuestionIndex < botQuestions.length) {
            setTimeout(() => {
                askNextQuestion();
            }, 1000);
        } else if (questionMode && currentQuestionIndex >= botQuestions.length) {
            setTimeout(() => {
                addMessage("Great job! You've completed all the questions. Feel free to ask me anything else about the lesson.", false);
                questionMode = false;
                currentQuestionIndex = 0;
                // Re-enable all options when questions are completed
                enableAllOptions();
            }, 1000);
        } else {
            await generateAIResponse(newMessage);
        }
    }

    // Prevent form submission
    chatForm.on('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // Handle send button click
    sendButton.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        sendMessage();
    });

    // Handle enter key press
    userInput.on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            e.stopPropagation();
            sendMessage();
        }
    });

  
    $('.quick-suggestion').click(function() {
        const suggestion = $(this).text();
        userInput.val(suggestion);
        sendMessage();
    });

  
    // Do NOT load chat history automatically
    // fetchChatHistory();

 
    userInput.focus();
});