# The easiest chatbot out there!

And it is a free webcomponent.

The license in this repository proves it is free for everyone. 

## Trying it out

Simply run the HTML file in a webserver and you are done. Note: you need NPM for this.

`npx live-server`

**Need NPM?**

[Download Node.js](https://nodejs.org/en)

## Using the chat in my own website

### Super easy setup

Without an openai API key the chat will work but it will be very lonely.

```
<chat-app openaiApiKey=" your api key "></chat-app>

<script src="chat-app.js" type="module"></script>
```

Make sure the file `chat-app.js` is in the path where you need it to be.

### Cool! But I want more options...

Options can be adjusted easily:

```
<chat-app
        <!-- Required parameter. -->
        openaiApiKey=" your api key "
        
        <!-- Required parameter for text-to-speech only. -->
        elevenlabsApiKey=" your api key "
        textToSpeechEnabled="false"
        
        <!-- These are default values. No need to define them but you can change the default values. -->
        gptResponseMaxCharacters="200"
        gptResponseTemperature="0.5"
        elevenlabsSimilarity="0"
        elevenlabsStability="0"
        
        <!-- This data will set your context for the chat. In this example, the chat will behave as DND Dungeon Master. -->
        prePrompt='[
        {"role":"system","content":"Act like a DND dungeon master using 5e rules and after every prompt ask the user for input."},
        {"role":"system","content":"Ask a user which characters will play and ask him for a character sheet of every character. Missing values can be made up. Show the character sheet after each creation and ask if there are others. If there are no more character sheets, ask the player to describe the world they play in. If you know what it looks like, begin the game."},
        {"role":"assistant","content": "Greetings adventurer! Welcome to my realm. Please tell me the names of your characters and we will start with their character sheet after that."}
        ]'
></chat-app>
```

## How do I get a license for ChatGPT?

Create an account for OpenAI

https://platform.openai.com/overview

Add payment information

https://platform.openai.com/account/billing/overview

Add an API key

https://platform.openai.com/account/api-keys

Use the API key in the HTML and you're done :) Happy chats!

## How do I get a licence for Text to Speech?

Create an account at Elevenlabs

https://beta.elevenlabs.io/subscription

Click on your avatar at the right top corner

Click on Profile

Create and use the API key from your profile

Use the API key in the HTML and you're done :) Happy voice!
