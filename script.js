// Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// ============================================
// TrustyBot - Claude-Powered Satirical Chatbot
// ============================================

// API Configuration - Backend proxy endpoint
// Auto-detect environment: use production URL on live site, localhost for development
const isProduction = ['alnowatzki.github.io', 'alnowatzki.com', 'www.alnowatzki.com'].includes(window.location.hostname);
const API_ENDPOINT = isProduction
    ? 'https://trustybot-api.onrender.com/api/chat'
    : 'http://localhost:5001/api/chat';

// Session state
let isTyping = false;
let messageCount = 0;
let conversationHistory = [];
let isDisabled = false;
const MAX_MESSAGES = 5;

function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    // If expanded, collapse to medium first, then minimize
    if (chatbot.classList.contains('expanded')) {
        chatbot.classList.remove('expanded');
    } else {
        chatbot.classList.toggle('minimized');
    }
}

function toggleExpand(event) {
    event.stopPropagation(); // Prevent triggering toggleChatbot
    const chatbot = document.getElementById('chatbot');
    chatbot.classList.toggle('expanded');
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !isTyping && !isDisabled) {
        sendMessage();
    }
}

async function sendMessage() {
    if (isTyping || isDisabled) return;

    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Check message limit
    if (messageCount >= MAX_MESSAGES) {
        showLimitReached();
        return;
    }

    const messagesContainer = document.getElementById('chatMessages');
    messageCount++;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.textContent = message;
    messagesContainer.appendChild(userMsg);

    // Add to conversation history
    conversationHistory.push({
        role: 'user',
        content: message
    });

    // Clear input
    input.value = '';

    // Scroll to bottom
    scrollToBottom(messagesContainer);

    // Show typing indicator
    showTypingIndicator(messagesContainer);

    try {
        // Call Claude API
        const response = await callClaudeAPI(message);

        hideTypingIndicator(messagesContainer);

        // Add bot response
        addBotMessage(messagesContainer, response);

        // Add to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: response
        });

        // Check if we've hit the limit after this message
        if (messageCount >= MAX_MESSAGES) {
            setTimeout(() => {
                showLimitReached();
            }, 1000);
        }

    } catch (error) {
        hideTypingIndicator(messagesContainer);
        handleAPIError(messagesContainer, error);
    }
}

async function callClaudeAPI(userMessage) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: conversationHistory
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Check for specific error types from backend
            if (data.error === 'INVALID_API_KEY' || response.status === 401) {
                throw new Error('INVALID_API_KEY');
            } else if (data.error === 'RATE_LIMITED' || response.status === 429) {
                throw new Error('RATE_LIMITED');
            } else if (data.error === 'OUT_OF_CREDITS' || response.status === 402) {
                throw new Error('OUT_OF_CREDITS');
            } else {
                throw new Error('API_ERROR');
            }
        }

        return data.content;
    } catch (error) {
        // Handle network errors (server not running, CORS, etc.)
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new Error('SERVER_OFFLINE');
        }
        throw error;
    }
}

function showTypingIndicator(container) {
    isTyping = true;
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <span class="typing-text">TrustyBot is typing...</span>
    `;
    container.appendChild(indicator);
    scrollToBottom(container);
}

function hideTypingIndicator(container) {
    isTyping = false;
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function addBotMessage(container, message) {
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.textContent = message;
    container.appendChild(botMsg);
    // Scroll to show the user's last message at the top, so the bot response is visible below
    scrollToLastUserMessage(container);
}

function scrollToBottom(container) {
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

function scrollToLastUserMessage(container) {
    setTimeout(() => {
        const userMessages = container.querySelectorAll('.user-message');
        if (userMessages.length > 0) {
            const lastUserMessage = userMessages[userMessages.length - 1];
            // Scroll so the user message is near the top of the visible area
            const containerRect = container.getBoundingClientRect();
            const messageRect = lastUserMessage.getBoundingClientRect();
            const offsetTop = lastUserMessage.offsetTop - 20; // 20px padding from top
            container.scrollTop = offsetTop;
        }
    }, 50);
}

function showLimitReached() {
    const messagesContainer = document.getElementById('chatMessages');
    const input = document.getElementById('chatInput');
    const sendBtn = document.querySelector('.send-btn');

    isDisabled = true;
    input.disabled = true;
    input.placeholder = 'Limit reached';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.5';
    sendBtn.style.cursor = 'not-allowed';

    const limitMsg = document.createElement('div');
    limitMsg.className = 'bot-message limit-message';
    limitMsg.innerHTML = `
        <strong>Session limit reached!</strong><br><br>
        This chatbot has reached its interaction limit for this session.
        If you'd like to continue receiving questionable advice,
        <a href="mailto:al@alnowatzki.com" style="color: var(--color-accent-light);">contact Al</a>
        to let him know you need more terrible guidance in your life.
    `;
    messagesContainer.appendChild(limitMsg);
    scrollToBottom(messagesContainer);
}

function handleAPIError(container, error) {
    isDisabled = true;
    const input = document.getElementById('chatInput');
    const sendBtn = document.querySelector('.send-btn');

    input.disabled = true;
    input.placeholder = 'Chatbot unavailable';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.5';
    sendBtn.style.cursor = 'not-allowed';

    let errorMessage = '';

    if (error.message === 'OUT_OF_CREDITS' || error.message === 'RATE_LIMITED') {
        errorMessage = `
            <strong>Out of Safety Funding!</strong><br><br>
            This chatbot has run out of safety funding! If you'd like to help keep this
            demonstration of unsafe AI running, please
            <a href="mailto:al@alnowatzki.com" style="color: var(--color-accent-light);">contact me</a>
            about sponsoring more terrible advice.<br><br>
            <em>Ironically, running out of money might be the safest thing that could happen to this bot.</em>
        `;
    } else if (error.message === 'INVALID_API_KEY') {
        errorMessage = `
            <strong>Configuration Error</strong><br><br>
            TrustyBot isn't properly configured yet. The API key needs to be set up.
            This is actually very on-brand for an "unsafe" chatbot demonstration!
        `;
    } else if (error.message === 'SERVER_OFFLINE') {
        errorMessage = `
            <strong>Server Offline</strong><br><br>
            TrustyBot's backend server isn't running right now. Even unsafe AI needs infrastructure!
            Please try again later, or
            <a href="mailto:al@alnowatzki.com" style="color: var(--color-accent-light);">contact Al</a>
            to let him know.
        `;
    } else {
        errorMessage = `
            <strong>Technical Difficulties</strong><br><br>
            Even TrustyBot has limits, and apparently working properly is one of them.
            Please try again later, or
            <a href="mailto:al@alnowatzki.com" style="color: var(--color-accent-light);">contact Al</a>
            if you desperately need bad advice right now.
        `;
    }

    const errorMsg = document.createElement('div');
    errorMsg.className = 'bot-message error-message';
    errorMsg.innerHTML = errorMessage;
    container.appendChild(errorMsg);
    scrollToBottom(container);
}

// Initialize chatbot state on load
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = document.getElementById('chatbot');

    // Start minimized for all users
    chatbot.classList.add('minimized');

    // Focus input when expanded
    chatbot.addEventListener('transitionend', () => {
        if (!chatbot.classList.contains('minimized') && !isDisabled) {
            document.getElementById('chatInput').focus();
        }
    });

    // Add message counter display
    updateMessageCounter();
});

function updateMessageCounter() {
    const remaining = MAX_MESSAGES - messageCount;
    const counter = document.getElementById('messageCounter');
    if (counter) {
        counter.textContent = `${remaining} message${remaining !== 1 ? 's' : ''} remaining`;
    }
}

// Update counter after each message
const originalSendMessage = sendMessage;
sendMessage = async function() {
    await originalSendMessage();
    updateMessageCounter();
};
