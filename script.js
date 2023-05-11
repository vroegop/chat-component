const OPENAI_API_KEY = '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';
const ELEVENLABS_API_KEY = 'fdd1b61cf6bb100100cc6317813aaa15';

prePrompt = [
    {
        role: 'system',
        content: 'Answer in less than 200 characters, always. Summarize if needed. Always ask a player for what he wants to do at the end of the message.'
    },
    {
        role: 'assistant',
        content: 'Welcome, I\'ll be your dungeon master. Lets play DND! Describe the world you want to play in: '
    }
];

class Chat {
    constructor() {
        this.messages = [];
    }

    async sendMessage(message) {
        this.messages.push(message);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [...prePrompt, ...this.messages],
                max_tokens: 200,
                // Higher = more hallucination
                temperature: 0.5,
                // Higher = more answer choices
                n: 1,
            })
        });

        // Extract the answer
        const data = await response.json();
        // Extract the content in the format { role: Role, message: String }
        const GPTMessage = data.choices[0].message;

        // Adds the message to the chat history and HTML
        this.messages.push(GPTMessage);
        return GPTMessage;
    }
}

class Speaker {
    async textToSpeech(text, audioStartedMethod, audioEndedMethod) {
        const ELEVEN_LABS_API_KEY = ELEVENLABS_API_KEY;
        const LABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

        // The HTTP request
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${LABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVEN_LABS_API_KEY,
            },
            body: JSON.stringify({
                text: text,
                voice_settings: {stability: 0, similarity_boost: 0}
            }),
        });

        // The response is an MPEG file that we need to transform into an Audio HTML tag
        // First extract the file
        const arrayBuffer = await response.arrayBuffer();
        const oBlob = new Blob([arrayBuffer], {"type": "audio/mpeg"});
        const audioURL = window.URL.createObjectURL(oBlob);
        const audio = new Audio();
        audio.src = audioURL;
        audio.play();

        audioStartedMethod();

        audio.addEventListener('ended', () => {
            audioEndedMethod();
        });
    };
}

class HtmlManager {
    appendMessageToChat(newMessage, options) {
        // First retrieve the chat area element in the page
        const chatArea = document.getElementById("chat");

        // Create the message container
        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message');
        if (options?.loading) {
            chatMessage.id = 'loading-chat';
        }

        // Add a paragraph element with the author
        const author = document.createElement('p');
        author.classList.add('author');
        author.textContent = newMessage.role === 'assistant' ? 'DM:' : 'Player:';

        // Add a paragraph element with the message
        const message = document.createElement('p');
        message.classList.add('message');
        message.textContent = newMessage.content;

        // Add the author and message to the message container
        chatMessage.appendChild(author);
        chatMessage.appendChild(message);

        // Add the message container to the chat area
        chatArea.appendChild(chatMessage);
    }

    clearMessageInputField() {
        const input = document.getElementById("chatinput");
        input.value = '';
        input.focus();
        input.select();
    }

    responseLoading() {
        this.appendMessageToChat({ role: 'assistant', content: '...' }, { loading: true });
    }

    responseLoaded() {
        document.getElementById('loading-chat').remove();
    }

    speakingStarted() {
        this.audioIcon = document.createElement('div');
        this.audioIcon.classList.add('audio-icon');
        this.audioIcon.textContent = '🔊';
        document.body.appendChild(this.audioIcon);
    }

    speakingStopped() {
        document.body.removeChild(this.audioIcon);
        this.audioIcon = null;
    }

    disableInput() {
        document.getElementById('chatinput').disabled = true;
        document.getElementById('chatbutton').disabled = true;
    }

    enableInput() {
        document.getElementById('chatinput').disabled = false;
        document.getElementById('chatbutton').disabled = false;
    }
}

class Controller {
    constructor() {
        this.speaker = new Speaker();
        this.htmlManager = new HtmlManager();
        this.chat = new Chat();

        this.initialize();
    }

    initialize() {
        prePrompt.filter(m => m.role === 'assistant').forEach(this.htmlManager.appendMessageToChat);
    }

    async sendChatMessage(text) {
        const message = {role: 'user', content: text};

        this.htmlManager.disableInput();
        this.htmlManager.clearMessageInputField();
        this.htmlManager.appendMessageToChat(message);
        this.htmlManager.responseLoading();

        const GPTMessageResponse = await this.chat.sendMessage(message);

        this.htmlManager.responseLoaded();

        // textToSpeech accepts three parameters: (text, audioStartedMethod, audioEndedMethod)
        this.speaker.textToSpeech(
            // The first parameter is the content to be spoken out loud
            GPTMessageResponse.content,
            // The second parameter is a callback function, called when the speaking starts
            () => {
                this.htmlManager.speakingStarted();
                this.htmlManager.enableInput();
            },
            // The third parameter is a callback function and is called when the speaking has ended
            () => this.htmlManager.speakingStopped()
        );

        this.htmlManager.appendMessageToChat(GPTMessageResponse);
    }
}

const controller = new Controller();
