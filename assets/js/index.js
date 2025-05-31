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
    let questionAnswerPairs = []; // Store Q&A pairs for backend submission
    let currentQuizSession = []; // Store current quiz session data
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
    function addMessage(message, isUser = false, timestamp = new Date().toISOString(), isHtml = false, isQuizQuestion = false) {
        const quizIndicator = isQuizQuestion ? `
            <div style="display: inline-flex; align-items: center; background: linear-gradient(135deg, rgba(255, 183, 77, 0.9), rgba(245, 158, 11, 0.9)); color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 8px; box-shadow: 0 2px 6px rgba(255, 183, 77, 0.3);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 4px;">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.59 10.75C9.77 11.57 8.45 11.57 7.63 10.75L5.12 8.24L3.71 9.65L6.22 12.16C7.46 13.4 8.96 14.02 10.46 14.02V16H8V18H16V16H13.54C15.04 16 16.54 15.38 17.78 14.14L21 10.9V9H21Z" fill="currentColor"/>
                </svg>
                <span>QUIZ QUESTION</span>
            </div>
        ` : '';
        
        const messageHtml = `
            <div class="flex items-start ${isUser ? 'justify-end' : ''}">
                ${!isUser ? `
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, rgb(105, 108, 255), rgb(85, 88, 235)); box-shadow: 0 2px 8px rgba(105, 108, 255, 0.3);">
                            ${isQuizQuestion ? `
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.5 7.5C9.5 5.01 11.51 3 14 3s4.5 2.01 4.5 4.5c0 2.31-1.64 4.22-3.75 4.65v1.35h-1.5v-1.35C11.14 11.72 9.5 9.81 9.5 7.5zM12.25 14h1.5v1.5h-1.5V14zM21 19.5H3v-1.5h18v1.5z" fill="white"/>
                                </svg>
                            ` : `
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C13.1 2 14 2.9 14 4V8C14 9.1 13.1 10 12 10S10 9.1 10 8V4C10 2.9 10.9 2 12 2ZM12 12C14.21 12 16 13.79 16 16V20C16 21.1 15.1 22 14 22H10C8.9 22 8 21.1 8 20V16C8 13.79 9.79 12 12 12ZM12 14C10.9 14 10 14.9 10 16V20H14V16C14 14.9 13.1 14 12 14ZM19 8C19.55 8 20 8.45 20 9S19.55 10 19 10 18 9.55 18 9 18.45 8 19 8ZM5 8C5.55 8 6 8.45 6 9S5.55 10 5 10 4 9.55 4 9 4.45 8 5 8ZM17.24 4.76C17.63 4.37 18.26 4.37 18.65 4.76S19.04 5.89 18.65 6.28 17.52 6.67 17.13 6.28 16.74 5.65 17.13 4.76H17.24ZM6.76 4.76C7.15 5.15 7.15 5.78 6.76 6.17S5.63 6.56 5.24 6.17 4.85 5.54 5.24 4.65C5.63 4.26 6.26 4.26 6.76 4.76Z" fill="white"/>
                                </svg>
                            `}
                        </div>
                    </div>
                ` : ''}
                <div class="${isUser ? 
                    'mr-3 text-white' : 
                    'ml-3 text-white'
                } rounded-2xl p-4 shadow-sm max-w-[80%]" style="${isUser ? 
                    'background: linear-gradient(135deg, rgba(105, 108, 255, 0.15), rgba(85, 88, 235, 0.25)); border: 1px solid rgba(105, 108, 255, 0.3); backdrop-filter: blur(8px); color: rgb(105, 108, 255);' : 
                    'background: linear-gradient(135deg, rgb(105, 108, 255), rgb(85, 88, 235)); box-shadow: 0 3px 12px rgba(105, 108, 255, 0.25);'
                }">
                    ${quizIndicator}
                    <div class="prose prose-sm ${isUser ? '' : 'prose-invert'} max-w-none">
                        ${isHtml ? message : (isUser ? message : markdownToHtml(message))}
                    </div>
                    <span class="text-xs opacity-75 mt-1 block">${formatTimestamp(timestamp)}</span>
                </div>
                ${isUser ? `
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, rgba(105, 108, 255, 0.2), rgba(85, 88, 235, 0.3)); border: 1px solid rgba(105, 108, 255, 0.4); backdrop-filter: blur(8px); box-shadow: 0 2px 8px rgba(105, 108, 255, 0.2);">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4 8 5.79 8 8 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="rgb(105, 108, 255)"/>
                            </svg>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        chatMessages.append(messageHtml);
     
        chatMessages.find('pre code').each((i, block) => {
            hljs.highlightElement(block);
        });
        
        // Reposition Quiz Me button after bot messages
        if (!isUser) {
            setTimeout(() => {
                positionQuizMeButton();
            }, 100);
        }
        
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }

    // Function to send individual Q&A pair to backend for evaluation
    async function evaluateCurrentAnswer(questionData) {
        try {
            const formattedLessonIds = await getFormattedLessonIds(courseId);
            addMessage("📊 Evaluating your answer...", false);
            console.log("---------Current Question-Answer Pair---------");
            console.log("Question Data:", questionData);
            console.log("Formatted Lesson IDs:", formattedLessonIds);
            const response = await fetch(`${CHATBOT_URL}/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    course_id: courseId.toString(),
                    lesson_id: lessonId.toString(),
                    lesson_ids: formattedLessonIds,
                    user_id: userId.toString(),
                    question_answers: [questionData], // Send single Q&A pair
                    lesson_name: lessonName,
                    question_number: questionData.question_number,
                    is_individual_evaluation: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit answer for evaluation');
            }

            const result = await response.json();
            
            // Display the evaluation result for this specific answer
            if (result.estimate || result.score || result.feedback) {
                let evaluationMessage = `📋 **Answer ${questionData.question_number} Assessment:**\n\n`;
                
                if (result.score) {
                    evaluationMessage += `**Score:** ${result.score}%\n\n`;
                }
                
                if (result.estimate) {
                    evaluationMessage += `**Assessment:** ${result.estimate}\n\n`;
                }
                
                if (result.feedback) {
                    evaluationMessage += `**Feedback:** ${result.feedback}\n\n`;
                }
                
                if (result.suggestions) {
                    evaluationMessage += `**Suggestions:** ${result.suggestions}\n\n`;
                }
                if (result.accurate_answer) {
                    evaluationMessage += `**Correct Answer:** ${result.accurate_answer}\n\n`;
                }
                addMessage(evaluationMessage, false);
            } else {
                addMessage(`✅ Answer ${questionData.question_number} recorded. Good job!`, false);
            }

        } catch (error) {
            console.error('Error evaluating answer:', error);
            addMessage("Sorry, there was an error evaluating your answer. Let's continue with the next question.", false);
        }
    }

    // Function to send Q&A data to backend for evaluation (only called at the end)
   async function submitQuestionAnswers() {
    try {
        addMessage("🎉 Quiz completed! Generating your performance summary...", false);
        const formattedLessonIds = await getFormattedLessonIds(courseId);
        
        // Prepare the request data
        const requestData = {
            course_id: courseId.toString(),
            lesson_id: lessonId.toString(),
            user_id: userId.toString(),
            lesson_ids: formattedLessonIds,
            lesson_name: lessonName,
            question_answers: currentQuizSession.map((qa, index) => ({
                question_number: index + 1,
                question: qa.question,
                answer: qa.answer,
                lesson_id: lessonId.toString(),
                course_id: courseId.toString(),
                user_id: userId.toString()
            })),
            is_individual_evaluation: false,
            is_final_summary: true,
            total_questions: currentQuizSession.length
        };

        const response = await fetch(`${CHATBOT_URL}/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error('Failed to submit quiz summary');
        }

        const result = await response.json();
        console.log("Quiz Summary Result:", result);
        // Display the overall summary
        if (result.overall_score !== undefined) {
            let summaryMessage = `
                <div class="mb-4 p-4 rounded-xl" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.15)); border: 1px solid rgba(16, 185, 129, 0.3);">
                    <h3 class="text-xl font-bold mb-2 text-green-600">Quiz Summary</h3>
                    <div class="flex items-center mb-3">
                        <div class="text-4xl font-bold mr-3" style="color: ${getScoreColor(result.overall_score)};">
                            ${result.overall_score}%
                        </div>
                        <div>
                            <div class="text-lg font-semibold">${result.overall_assessment}</div>
                            <div class="text-sm opacity-80">${currentQuizSession.length} questions answered</div>
                        </div>
                    </div>
                    <p class="mb-2">${result.final_feedback}</p>
                    <p><strong>Recommendations:</strong> ${result.recommendations}</p>
                </div>
            `;
            
            // Add a chart visualization
            summaryMessage += `
                <div class="mb-6">
                    <h4 class="text-lg font-semibold mb-3">Performance Breakdown</h4>
                    <div class="flex items-end h-32 gap-2 mb-4">
            `;
            
            result.question_answers_breakdown.forEach(item => {
                const height = Math.max(20, item.score); // Ensure minimum height
                summaryMessage += `
                    <div class="flex flex-col items-center flex-1">
                        <div 
                            class="w-full rounded-t-md transition-all duration-500 ease-out"
                            style="height: ${height}%; background: linear-gradient(to top, ${getScoreColor(item.score, true)}, ${getScoreColor(item.score)});"
                        ></div>
                        <div class="text-xs mt-1">Q${item.question_number}</div>
                        <div class="text-xs font-semibold" style="color: ${getScoreColor(item.score)};">
                            ${item.score}%
                        </div>
                    </div>
                `;
            });
            
            summaryMessage += `
                    </div>
                </div>
            `;
            
            // Add a table for detailed breakdown
            summaryMessage += `
                <h4 class="text-lg font-semibold mb-3">Question Analysis</h4>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-700">
                        <thead class="bg-gray-800">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Question</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Your Answer</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Score</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Feedback</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Correct Answer</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700">
            `;
            
            result.question_answers_breakdown.forEach(item => {
                summaryMessage += `
                    <tr class="hover:bg-gray-800 transition-colors">
                        <td class="px-4 py-3 text-sm">${item.question}</td>
                        <td class="px-4 py-3 text-sm max-w-xs">${item.answer || 'No answer'}</td>
                        <td class="px-4 py-3">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                                style="background-color: ${getScoreColor(item.score, true)}; color: ${item.score > 60 ? 'white' : 'black'}">
                                ${item.score}% - ${item.estimate}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm">${item.feedback}</td>
                        <td class="px-4 py-3 text-sm font-medium" style="color: #10B981;">${item.accurate_answer}</td>
                    </tr>
                `;
            });
            
            summaryMessage += `
                        </tbody>
                    </table>
                </div>
            `;
            
            addMessage(summaryMessage, false, new Date().toISOString(), true);
        } else {
            addMessage("Quiz completed! Thank you for your participation.", false);
        }

    } catch (error) {
        console.error('Error submitting quiz summary:', error);
        addMessage("Quiz completed! Thank you for your participation.", false);
    }
}

// Helper function to get color based on score
function getScoreColor(score, isBg = false) {
    if (score >= 90) return isBg ? '#065F46' : '#10B981'; // Emerald
    if (score >= 80) return isBg ? '#047857' : '#34D399'; // Green
    if (score >= 70) return isBg ? '#0C4A6E' : '#0EA5E9'; // Sky
    if (score >= 60) return isBg ? '#9A3412' : '#F97316'; // Orange
    return isBg ? '#7F1D1D' : '#EF4444'; // Red
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
        // Remove Quiz Me button during quiz mode
        $('.quiz-me-button').remove();
    }

    function enableAllOptions() {
        enableOption('fetch-history-card', fetchChatHistory);
        // Quiz Me button will be positioned by positionQuizMeButton() call
        // No need to manually enable it here since it's handled in positionQuizMeButton()
    }

    // Function to ask the next bot question
    function askNextQuestion() {
        if (currentQuestionIndex < botQuestions.length) {
            // Display the original question text without modification
            const questionText = botQuestions[currentQuestionIndex];
            // Mark this as a quiz question with special styling
            addMessage(questionText, false, new Date().toISOString(), false, true);
            
            // Store the question in current session
            const currentQuestion = {
                question_number: currentQuestionIndex + 1,
                question: botQuestions[currentQuestionIndex],
                answer: null, // Will be filled when user responds
                timestamp: new Date().toISOString()
            };
            currentQuizSession.push(currentQuestion);
            
            currentQuestionIndex++;
        }
        // Quiz completion logic is now handled in sendMessage after evaluation
    }

    // Show only the welcome message as the first chat message
    chatMessages.empty();
    addMessage(
        `Welcome to Novo Bot, I am here to help you understand more about <span class='font-bold text-lg text-blue-200 bg-blue-700 px-2 py-1 rounded'>${lessonName}</span>. You can ask me questions to make sure you understand material. `,
        false,
        new Date().toISOString(),
        true
    );

    // Create Chat History button next to debug info
    $('body').append(`
        <div class="chat-history-button">
            <div class="option-card" id="fetch-history-card">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 4px;">
                    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM16.5 16.25L11 12.25V7H12.5V11.25L17.25 14.75L16.5 16.25Z" fill="rgb(21, 128, 61)"/>
                </svg>
                <div class="font-semibold text-base">Chat History</div>
            </div>
        </div>
    `);

    // Function to position Quiz Me button relative to last bot message
    function positionQuizMeButton() {
        // Remove existing quiz me button
        $('.quiz-me-button').remove();
        
        // Don't show Quiz Me button during quiz mode
        if (questionMode) {
            return;
        }
        
        // Find the last bot message (not user message)
        const botMessages = chatMessages.find('.flex.items-start').not('.justify-end');
        const lastBotMessage = botMessages.last();
        
        if (lastBotMessage.length > 0) {
            // Create Quiz Me button and append it after the last bot message
            const quizButton = $(`
                <div class="quiz-me-button">
                    <div id="quiz-me-card">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 4px;">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="rgb(180, 83, 9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        </svg>
                        <div class="font-semibold text-base">Quiz Me</div>
                    </div>
                </div>
            `);
            
            lastBotMessage.after(quizButton);
            
            // Bind click event
            $('#quiz-me-card').off('click').on('click', function() {
                if (!$(this).hasClass('disabled')) {
                    // Start new quiz session
                    questionMode = true;
                    currentQuestionIndex = 0;
                    currentQuizSession = []; // Reset quiz session data
                    disableAllOptions(); // Disable buttons during quiz
                    
                    // Hide Quiz Me button immediately when quiz starts
                    $('.quiz-me-button').remove();
                    
                    addMessage("🎯 Starting quiz session! I'll ask you 3 questions about the lesson.", false);
                    setTimeout(() => {
                        askNextQuestion();
                    }, 1000);
                }
            });
        }
    }

    // Position Quiz Me button initially
    positionQuizMeButton();

    // Clear the chat options area since Quiz Me is now positioned separately
    chatOptions.html('');

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
            <span>Sending...</span>
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
                        <div class="w-10 h-10 rounded-full" style="background: linear-gradient(135deg, rgb(105, 108, 255), rgb(85, 88, 235)); box-shadow: 0 2px 8px rgba(105, 108, 255, 0.3);">
                            <span class="text-white text-sm font-medium flex items-center justify-center h-full">AI</span>
                        </div>
                    </div>
                    <div class="ml-3 text-white rounded-2xl p-4 shadow-sm max-w-[80%]" style="background: linear-gradient(135deg, rgb(105, 108, 255), rgb(85, 88, 235)); box-shadow: 0 3px 12px rgba(105, 108, 255, 0.25);">   
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

            // Reposition Quiz Me button after bot response
            setTimeout(() => {
                positionQuizMeButton();
            }, 100);

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
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                <span>Send</span>
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

        // If in question mode, ONLY handle quiz Q&A - no AI responses
        if (questionMode) {
            // Find the current question in the session and add the user's answer
            const currentQuestionIndex_zero = currentQuestionIndex - 1; // Adjust for zero-based indexing
            if (currentQuestionIndex_zero >= 0 && currentQuestionIndex_zero < currentQuizSession.length) {
                currentQuizSession[currentQuestionIndex_zero].answer = content;
                currentQuizSession[currentQuestionIndex_zero].answer_timestamp = new Date().toISOString();
                
                console.log(`Stored answer for question ${currentQuestionIndex_zero + 1}:`, content);
                
                // Evaluate this specific question-answer pair immediately
                const currentQuestionData = currentQuizSession[currentQuestionIndex_zero];
                
                setTimeout(async () => {
                    await evaluateCurrentAnswer(currentQuestionData);
                    
                    // After evaluation, continue with next question or finish quiz
                    setTimeout(() => {
                        if (currentQuestionIndex < botQuestions.length) {
                            askNextQuestion();
                        } else {
                            // All questions answered and evaluated - show final summary
                            setTimeout(() => {
                                submitQuestionAnswers();
                                questionMode = false; // Exit quiz mode
                                currentQuestionIndex = 0;
                                
                                // Re-enable all options and show Quiz Me button after summary
                                setTimeout(() => {
                                    enableAllOptions();
                                    positionQuizMeButton(); // Show Quiz Me button again
                                }, 2000);
                            }, 1000);
                        }
                    }, 1500); // Wait for evaluation response to be displayed
                }, 500);
            }
            // Don't generate AI response during quiz mode - return early
            return;
        }

        // Normal chat mode - generate AI response (only when NOT in quiz mode)
        await generateAIResponse(newMessage);
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