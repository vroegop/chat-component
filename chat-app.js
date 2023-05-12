import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

class ChatApp extends LitElement {
    static get properties() {
        return {
            messages: {type: Array},
            systemPrompts: {type: Array},
            messageText: {type: String},
            prePrompt: {type: String},
            gptResponseMaxCharacters: {type: Number},
            gptResponseTemperature: {type: Number},
            elevenlabsStability: {type: Number},
            elevenlabsSimilarity: {type: Number},
            textToSpeechEnabled: {type: String},
            // required properties
            openaiApiKey: {type: String},
            elevenlabsApiKey: {type: String},
        };
    }

    // Gets called before the properties set via HTML are injected, allowing for default values
    constructor() {
        super();
        this.messages = [];
        this.messageText = '';
        this.gptResponseMaxCharacters = 200;
        this.gptResponseTemperature = 0.5;
        this.elevenlabsStability = 0;
        this.elevenlabsSimilarity = 0;
        this.textToSpeechEnabled = false;

        this.openaiApiKey = localStorage.getItem('openaiApiKey');
        this.elevenlabsApiKey = localStorage.getItem('elevenlabsApiKey');
    }

    // Gets called after the properties set via HTML are injected, overriding default values
    connectedCallback() {
        super.connectedCallback();
        this.allPrePrompts = JSON.parse(this.prePrompt.replaceAll('\n', '').replaceAll('  ', ''));
        this.messages = [ ...this.allPrePrompts.filter(m => m.role !== 'system'), ...this.messages ];
        this.systemPrompts = this.allPrePrompts.filter(m => m.role === 'system');
    }

    // All CSS goes in here
    static get styles() {
        return css`
          :host {
            display: flex;
            justify-content: space-between;
            flex-direction: column;
            font-family: "Helvetica Neue", Arial, sans-serif;
            background-color: #919191;
            color: #fff;
            padding: 16px;
            flex-grow: 1;
            min-width: 300px;
          }

          .container {
            display: flex;
            flex-direction: column;
            align-content: space-between;
            flex-grow: 1;
          }

          .messages {
            list-style: none;
            margin: 0;
            padding: 0;
            overflow-y: auto;
            flex: 1;
          }

          .message {
            background-color: #1f1f1f;
            padding: 8px 16px;
            border-radius: 8px;
            margin: 8px 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
          }

          .input-container {
            display: flex;
            margin-top: 16px;
          }

          .input-container input[type=text] {
            flex: 1;
            padding: 8px;
            border-radius: 4px;
            border: none;
            background-color: #242424;
            color: #fff;
            font-size: 16px;
            font-family: "Helvetica Neue", Arial, sans-serif;
          }

          .input-container button {
            background-color: #4CAF50;
            color: #fff;
            border: none;
            padding: 8px;
            border-radius: 4px;
            margin-left: 8px;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
          }

          .input-container button:hover {
            background-color: #3e8e41;
          }
        `;
    }

    // All HTLM goes in here
    render() {
        return html`
            <div class="container">
                <ul class="messages">
                    ${this.messages.map((message) => html`
                        <li class="message">${message.content}</li>
                    `)}
                </ul>
                <div class="input-container">
                    <input type="text"
                           placeholder="Type your message here"
                           @input="${this.handleInput}"
                           .value="${this.messageText}"
                           @keypress="${this.handleKeyPress}"
                    />
                    <button @click="${this.sendMessage}">Send</button>
                </div>
            </div>
        `;
    }

    // Handles input set in the input field
    handleInput(event) {
        this.messageText = event.target.value;
    }

    // Handles the buttons pressed in the input field
    handleKeyPress(event) {
        if (event.key === 'Enter') {
            this.sendMessage();
        }
    }

    // Adds the message to the message history, sends the full history to ChatGPT and adds the answer to the history too
    async sendMessage() {
        if (this.messageText) {
            const newMessage = {role: 'user', content: this.messageText};
            this.messages = [...this.messages, newMessage];
            this.dispatchEvent(new CustomEvent('new-chat-message', {detail: newMessage}));
            this.messageText = '';

            if (this.openaiApiKey) {
                const gptResponse = await this.getChatGPTResponse([...this.systemPrompts, ...this.messages]);
                this.dispatchEvent(new CustomEvent('new-chat-message', {detail: gptResponse}));
                this.messages = [...this.messages, gptResponse];

                if (this.elevenlabsApiKey && this.textToSpeechEnabled && this.textToSpeechEnabled !== 'false') {
                    this.textToSpeech(gptResponse.content);
                }
            }
        }
    }

    // Connects to ChatGPT to get a chat response
    async getChatGPTResponse(messages) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages,
                max_tokens: this.gptResponseMaxCharacters,
                temperature: this.gptResponseTemperature,
                n: 1,
            })
        });

        const data = await response.json();
        return data.choices[0].message;
    }

    // Connects to Elevenlabs to create text to speech
    async textToSpeech(text) {
        const LABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${LABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': this.elevenlabsApiKey,
            },
            body: JSON.stringify({
                text: text,
                voice_settings: {stability: this.elevenlabsStability, similarity_boost: this.elevenlabsSimilarity}
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
    };
}
customElements.define('chat-app', ChatApp);
