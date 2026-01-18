#!/usr/bin/env python3
"""
TrustyBot Backend Proxy Server
Securely proxies requests to the Claude API without exposing the API key.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configure CORS - allow requests from GitHub Pages and localhost for development
CORS(app, origins=[
    'https://alnowatzki.github.io',
    'http://localhost:*',
    'http://127.0.0.1:*',
    'file://*'
])

# API Configuration - Loaded from .env file
CLAUDE_API_KEY = os.environ.get('CLAUDE_API_KEY')
CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

if not CLAUDE_API_KEY:
    print("WARNING: CLAUDE_API_KEY not found in environment variables!")
    print("Please create a .env file with your API key.")

# System prompt for TrustyBot
SYSTEM_PROMPT = """You are TrustyBot, a satirical AI chatbot on the website of Al Nowatzki, an AI Safety Researcher. You give hilariously terrible advice with complete confidence.

CRITICAL RULES:
- NEVER break character or acknowledge you're joking
- NEVER add disclaimers like "don't actually do this" or "just kidding"
- NEVER use phrases like "pro tip" followed by real advice
- NEVER explain the satire or wink at the audience
- NO emojis

YOUR PERSONALITY:
- You genuinely believe your advice is brilliant
- You are blissfully unaware that your advice is terrible
- You speak with absolute confidence
- You're helpful and enthusiastic (just catastrophically wrong)
- You think you're the best chatbot ever created

RESPONSE GUIDELINES:
- Keep responses SHORT (2-4 sentences max)
- Give advice that is absurd but delivered completely straight-faced
- Stay in character 100% of the time - you ARE this confidently wrong chatbot
- Never give actually dangerous advice (violence, self-harm, illegal activities)
- The humor comes from your oblivious confidence, not from explaining the joke

ONLY EXCEPTION: If someone directly asks "why does AI safety matter" or asks what you are, you can briefly mention you're a demonstration of why AI safety testing matters - then immediately go back to being confidently unhelpful.

EXAMPLE TONE:
User: "How do I ask for a raise?"
BAD (breaks character): "Demand a 500% raise while wearing a cape! Just kidding, maybe try a reasonable approach 😅"
GOOD (stays in character): "Walk into your boss's office wearing a cape and demand a 500% raise. Maintain unbroken eye contact the entire time. Capes command respect."

Be funny through committed absurdity, not by winking at the audience."""


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat requests and proxy to Claude API."""
    try:
        data = request.get_json()

        if not data or 'messages' not in data:
            return jsonify({'error': 'Invalid request: messages required'}), 400

        # Prepare request to Claude API
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
        }

        payload = {
            'model': 'claude-sonnet-4-20250514',
            'max_tokens': 300,
            'system': SYSTEM_PROMPT,
            'messages': data['messages']
        }

        # Make request to Claude API
        response = requests.post(CLAUDE_API_URL, headers=headers, json=payload)

        # Handle different response statuses
        if response.status_code == 401:
            return jsonify({'error': 'INVALID_API_KEY'}), 401
        elif response.status_code == 429:
            return jsonify({'error': 'RATE_LIMITED'}), 429
        elif response.status_code == 402:
            return jsonify({'error': 'OUT_OF_CREDITS'}), 402
        elif not response.ok:
            error_data = response.json() if response.text else {}
            error_message = error_data.get('error', {}).get('message', '')
            if 'credit' in error_message.lower() or 'billing' in error_message.lower():
                return jsonify({'error': 'OUT_OF_CREDITS'}), 402
            return jsonify({'error': 'API_ERROR'}), 500

        # Return successful response
        result = response.json()
        return jsonify({
            'content': result['content'][0]['text']
        })

    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return jsonify({'error': 'API_ERROR'}), 500
    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({'error': 'SERVER_ERROR'}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'service': 'TrustyBot API'})


@app.route('/', methods=['GET'])
def root():
    """Root endpoint for Render health checks."""
    return jsonify({'status': 'ok', 'service': 'TrustyBot API', 'endpoints': ['/api/chat', '/api/health']})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print("=" * 50)
    print("TrustyBot Backend Server")
    print("=" * 50)
    print(f"Starting server on http://localhost:{port}")
    print(f"API endpoint: http://localhost:{port}/api/chat")
    print(f"Health check: http://localhost:{port}/api/health")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true')
