<?php
//ENV
$CHATBOT_BACKEND_URL = 'https://backend1.brainovo.com/api';
$CHATBOT_APP_API_URL = 'https://qa.brainovo.net';

//Get course and lesson IDs from request
$course_id = isset($_REQUEST['course_id']) ? (int)$_REQUEST['course_id'] : 0;
$lesson_id = isset($_REQUEST['lesson_id']) ? (int)$_REQUEST['lesson_id'] : 0;

// Validate IDs
if($course_id <= 0 || $lesson_id <= 0) {
    echo "<div style='text-align: center; padding: 20px; color: #666;'>";
    echo "<h2 style='color: rgb(105, 108, 255);'>Error: Invalid Course or Lesson ID</h2>";
    echo "<p>Please make sure you have provided valid course and lesson IDs in the URL.</p>";
    echo "<p>Example: index.php?course_id=1&lesson_id=1</p>";
    echo "</div>";
    exit;
}

//TEMP
$url = 'https://qa.brainovo.net/route/basicauth?code=S-14.6.4553.195.1740588891&password=12345678&email=ken+test4%40bizmanage.com';
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true); // POST request
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // --location in curl
$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Error: ' . curl_error($ch);
} else {
    //echo 'Response: ' . $response;
}

curl_close($ch);

$response = json_decode($response, true);

$auth_token = '';
if(isset($response['token'])) {
    $auth_token = $response['token'];
}else{
    echo 'Error: No token received from the API.';
    exit;
}

$sessionorgid=$response['orgid'];
$sessionuid=$response['testing-userid'];
$sessionrole='admin';

$course_name='';
$lesson_name='';
$lesson_training_category='';
$lesson_transcript_summary_questions = [];

//COURSE
$url = 'https://qa.brainovo.net/route/'.$auth_token.'/trainingcourse/'.$course_id.'?payload=[]&expand=owner&dataonly=true';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // equivalent to --location
curl_setopt($ch, CURLOPT_HTTPGET, true); // explicit GET request
curl_setopt($ch, CURLOPT_FAILONERROR, true); // makes curl_exec return false on HTTP error codes

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo 'Error: ' . curl_error($ch);
} else {
    $data = json_decode($response, true);

    if (isset($data['name'])) {
        $course_name = $data['name'];
    } else {
        echo "Error. Missing data in response.";
        die();
    }
}

curl_close($ch);

//LESSON
$url = 'https://qa.brainovo.net/route/'.$auth_token.'/traininglesson/'.$lesson_id.'?payload=[]&expand=owner&dataonly=true';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // equivalent to --location
curl_setopt($ch, CURLOPT_HTTPGET, true); // explicit GET request
curl_setopt($ch, CURLOPT_FAILONERROR, true); // makes curl_exec return false on HTTP error codes

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo 'Error: ' . curl_error($ch);
} else {
    $data = json_decode($response, true);

    if (isset($data['name']) && isset($data['trainingcategory'])) {
        $lesson_name = $data['name'];
        $lesson_training_category = $data['trainingcategory'];
        $jsontranscriptsummary = $data['jsontranscriptsummary'];
        $lesson_transcript_summary_questions = json_decode($jsontranscriptsummary, true);
    } else {
        echo "Error. Missing data in response.";
        die();
    }
}

curl_close($ch);


?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Video Chatbot</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- jQuery CDN -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- Marked.js for Markdown parsing -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <!-- Highlight.js for code syntax highlighting -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
    <link rel="stylesheet" href="assets/css/index.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <script>
    // Static parameters - will embedded into env file
    window.courseId = <?=$course_id?>;
    window.lessonId = <?=$lesson_id?>;
    window.userId = <?=$sessionuid?>;
    window.CHATBOT_URL = '<?=$CHATBOT_BACKEND_URL?>';
    window.APP_API_URL = '<?=$CHATBOT_APP_API_URL?>';
    window.AUTH_TOKEN = "<?=$auth_token?>";
    </script>
</head>
<body class="min-h-screen NO-flex items-center justify-center" style="">
    <!-- Course: <?=$course_name?><br>Lesson: <?=$lesson_name?><br>Category: <?=$lesson_training_category?><br>
    <br>
    <?
    foreach($lesson_transcript_summary_questions as $key => $questiontext){
        echo "<div class='text-gray-700'>Question $key: $questiontext</div>";
    }
    ?> -->
    <hr>

    <div class="container">
        <div class="welcome-message">
            <h1 class="text-2xl font-bold mb-4">Welcome to Novo Bot</h1>
            <p class="mb-4">I am here to help you understand more about <?=$lesson_name?>. You can ask me questions or I can ask you some questions to make sure you understood the material.</p>
            <button id="start-questions" class="question-button">Yes, ask me questions</button>
        </div>

        <div class="chat-container">
        <!-- Chat Messages -->
            <div id="chat-messages" class="space-y-4">
                <!-- Messages will be dynamically added here -->
            </div>
            
            <!-- Input Bar -->
            <div class="chat-input-container">
                <form id="chat-form" class="flex items-center gap-2" onsubmit="return false;">
                    <input type="text" id="user-input" class="chat-input flex-1 rounded-full px-4 py-2 focus:outline-none" placeholder="Type your question..." autocomplete="off" />
                    <button type="button" id="send-button" class="send-button px-6 py-2 rounded-full font-semibold transition">Send</button>
                </form>
            </div>
        </div>
    </div>

    <script src="assets/js/index.js"></script>

    <div class="" style="width:100%;display:block;text-align:center;margin-top:10px;">
    <?php
    echo "DEBUG: Session Org ID: $sessionorgid, User ID: $sessionuid, Role: $sessionrole";
    ?>
    </div>

    <script>
    document.getElementById('start-questions').addEventListener('click', function() {
        const firstQuestion = <?= json_encode($lesson_transcript_summary_questions['q1']) ?>;
        const chatMessages = document.getElementById('chat-messages');
        
        // Add bot message with first question
        const botMessage = document.createElement('div');
        botMessage.className = 'chat-message bot-message';
        botMessage.textContent = firstQuestion;
        chatMessages.appendChild(botMessage);
        
        // Hide welcome message
        document.querySelector('.welcome-message').style.display = 'none';
    });
    </script>
</body>
</html> 