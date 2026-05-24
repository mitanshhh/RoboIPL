# 🏏 Agentic Premiere League (APL)
**Live Multi-Agent Cricket Commentary System**

Welcome to the **Agentic Premiere League**! This project is a cutting-edge, real-time cricket simulation and commentary platform that leverages multiple autonomous AI agents to deliver dynamic, engaging, and realistic live commentary. 

By employing a multi-agent architecture, the system simulates the banter, expert analysis, and play-by-play excitement of a real IPL (Indian Premier League) match, streaming updates directly to the browser via WebSockets.

---

## 🚀 Key Features

- **Multi-Agent AI Commentary**: Features dedicated AI commentators (e.g., MI Agent, RR Agent, and a RAG Expert) that debate, analyze, and react to the match in real-time.
- **Real-Time WebSockets Streaming**: Instantaneous scorecard updates and audio/text commentary broadcasted to the frontend with zero polling.
- **Live Match Simulation**: An underlying engine that dynamically simulates cricket matches ball-by-ball.
- **Contextual Memory (RAG)**: Agents recall past match events, current partnerships, and momentum shifts to provide highly contextual commentary.
- **Responsive UI**: A modern React-based frontend providing a sleek, interactive scorecard and live audio player.

---

## 🛠️ Technology Stack & Google Ecosystem

This project utilizes the **Google Cloud** and **Google AI** ecosystem to achieve real-time scale and cutting-edge intelligence. These are excellent technologies to feature in your portfolio:

### Core AI & Machine Learning
- **Google Gemini (via `google-generativeai`)**: Powers the brain of the multi-agent system. Gemini is responsible for generating context-aware, highly personalized commentary (including Hinglish nuances) for each AI persona.
- **Google Cloud Text-to-Speech (gTTS)**: Converts the generated text commentary into lifelike, emotive audio streams on the fly. *(Note: System architecture allows swapping between gTTS and ElevenLabs)*.
- **Google Vertex AI** *(Architecture Extension)*: Can be used for fine-tuning custom models specifically trained on historical IPL commentary datasets to give the agents a unique voice.

### Backend & Infrastructure
- **Python & FastAPI**: High-performance asynchronous backend.
- **WebSockets**: For bi-directional, low-latency streaming of match states.
- **Google Cloud Run** *(Deployment Target)*: Containerized serverless deployment of the FastAPI backend to handle real-time WebSocket connections at scale.
- **Google Cloud Pub/Sub** *(Architecture Extension)*: Can be used to decouple the match simulation engine from the WebSocket broadcasting layer for massive scale.

### Frontend & Data
- **React 19 & TypeScript**: Component-driven UI.
- **Vite**: Blazing fast frontend tooling.
- **Google Firebase Hosting** *(Deployment Target)*: Lightning-fast global CDN delivery of the frontend static assets.
- **Google Cloud Firestore**: Schema-less NoSQL document database for persisting match history and commentary logs for post-match analysis.

---

## 📂 Project Structure

```text
Agentic Premiere League/
├── backend/
│   ├── app/
│   │   ├── config.py            # Environment and LLM configurations
│   │   ├── match_data.py        # Cricket match simulation logic
│   │   ├── orchestrator.py      # Multi-agent coordination and debate logic
│   │   ├── tts.py               # Text-to-Speech engine integration
│   │   └── websocket_manager.py # Real-time event broadcasting
│   ├── main.py                  # FastAPI application entry point
│   └── requirements.txt         # Python dependencies
└── frontend/
    ├── src/                     # React components (Scoreboard, AudioPlayer, etc.)
    ├── package.json             # Node.js dependencies
    └── vite.config.ts           # Vite configuration
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **Google Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/).

### 1. Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

Set up your environment variables by creating a `.env` file in the `backend` directory:
```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
# Add any additional TTS API keys if required
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Install the required NPM packages:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

### 3. Run the App
Open your browser and navigate to `http://localhost:5173`. Click **"Start Live Commentary"** to kick off the multi-agent IPL simulation!

---

## 🧠 How the Multi-Agent System Works

1. **Simulation Trigger**: A ball is simulated (`simulate_next_ball()`), generating the outcome (e.g., 6 runs, Wicket, Dot ball).
2. **Context Compression**: The current match state, recent sequence of balls, and historical context are packaged.
3. **Agent Debate (Gemini)**:
   - **Agent 1** reviews the context and generates a reaction.
   - **Agent 2** reviews the context + Agent 1's reaction, generating a counter-argument or supporting statement.
   - **RAG Expert** (conditionally triggered) chimes in with deep statistical insights if the situation demands it.
4. **Speech Synthesis**: The resulting text is sent to the TTS engine to generate audio.
5. **Broadcast**: The backend broadcasts the updated JSON payload (containing text, stats, and audio URLs) via WebSockets to the React frontend.
