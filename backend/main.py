import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from typing import Dict, Any, List

from app.config import config
from app.match_data import MatchSimulator
from app.orchestrator import orchestrator
from app.tts import tts_engine
from app.websocket_manager import manager

logger = logging.getLogger("main")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="IPL Live Multi-Agent Commentary System")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for audio file streaming and assets
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(os.path.join(static_dir, "audio"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Global match and orchestrator states
simulator = MatchSimulator()
global_insights = [
    "MI need 50 runs off 30 balls at Wankhede Stadium.",
    "Ashwin is starting the death-overs spell for Rajasthan Royals."
]
all_match_commentary: List[Dict[str, Any]] = []
auto_sim_task: bool = False

@app.on_event("startup")
async def startup_event():
    logger.info("IPL Live backend started successfully.")

@app.get("/api/state")
def get_state():
    """Returns the current full state of the match."""
    state = simulator.get_full_state()
    state["key_insights"] = global_insights
    state["commentary_history"] = all_match_commentary[-15:]  # last 15 commentaries
    return state

@app.post("/api/reset")
async def reset_match():
    """Resets the match and commentary database."""
    global global_insights, all_match_commentary, auto_sim_task
    auto_sim_task = False
    simulator.reset_match()
    global_insights = [
        "MI need 50 runs off 30 balls at Wankhede Stadium.",
        "Ashwin is starting the death-overs spell for Rajasthan Royals."
    ]
    all_match_commentary.clear()
    state = simulator.get_full_state()
    state["key_insights"] = global_insights
    state["commentary_history"] = []
    
    # Broadcast reset event to all listening WebSockets
    await manager.broadcast({
        "event": "reset",
        "state": state
    })
    
    return {"status": "success", "message": "Match state reset successfully."}

async def process_ball_and_broadcast() -> Dict[str, Any]:
    """Core pipeline: Simulates a ball, triggers multi-agent debate, generates audio, and broadcasts via WS."""
    global global_insights, all_match_commentary
    
    # 1. Simulate the ball
    ball_package = simulator.simulate_next_ball()
    if "error" in ball_package:
        return ball_package
        
    full_state = simulator.get_full_state()
    is_over_completed = simulator.is_over_completed
    
    # 2. Build the shared context
    shared_context = {
        "match_state": full_state["match_state"],
        "current_ball": ball_package,
        "recent_sequence": full_state["recent_sequence"],
        "commentary_history": [],
        "key_insights": global_insights
    }

    commentary_entries = []

    # 3. Agent 1 (MI Agent) Commentates
    mi_text = orchestrator.generate_commentary_turn("MI Agent", shared_context, ball_package)
    mi_audio = tts_engine.generate_speech("MI Agent", mi_text)
    mi_entry = {"agent": "MI Agent", "text": mi_text, "audio": mi_audio}
    commentary_entries.append(mi_entry)
    shared_context["commentary_history"].append({"agent": "MI Agent", "text": mi_text})

    # 4. Agent 2 (RR Agent) Commentates
    rr_text = orchestrator.generate_commentary_turn("RR Agent", shared_context, ball_package)
    rr_audio = tts_engine.generate_speech("RR Agent", rr_text)
    rr_entry = {"agent": "RR Agent", "text": rr_text, "audio": rr_audio}
    commentary_entries.append(rr_entry)
    shared_context["commentary_history"].append({"agent": "RR Agent", "text": rr_text})

    # 5. Agent 3 (RAG Expert) Commentates Conditionally
    rag_triggered = orchestrator.should_trigger_rag(ball_package, mi_text, rr_text)
    if rag_triggered:
        rag_text = orchestrator.generate_commentary_turn("RAG Expert", shared_context, ball_package)
        rag_audio = tts_engine.generate_speech("RAG Expert", rag_text)
        rag_entry = {"agent": "RAG Expert", "text": rag_text, "audio": rag_audio}
        commentary_entries.append(rag_entry)
        shared_context["commentary_history"].append({"agent": "RAG Expert", "text": rag_text})

    # Record to historical log
    for entry in commentary_entries:
        all_match_commentary.append({
            "over": full_state["match_state"]["overs"],
            "agent": entry["agent"],
            "text": entry["text"],
            "audio_url": entry["audio"]["audio_url"],
            "use_browser_tts": entry["audio"]["use_browser_tts"],
            "text_to_speak": entry["audio"].get("text_to_speak", entry["text"]),
            "gender": entry["audio"]["gender"]
        })

    # 6. Over Compression Logic
    compression_occurred = False
    if is_over_completed:
        logger.info(f"Over {int(full_state['match_state']['overs'])} completed. Compressing context...")
        new_insights = orchestrator.compress_context_over(shared_context)
        global_insights = new_insights
        compression_occurred = True

    # 7. Broadcast via WebSockets
    payload = {
        "event": "ball_event",
        "match_state": full_state["match_state"],
        "partnership": full_state["partnership"],
        "player_stats": full_state["player_stats"],
        "recent_sequence": full_state["recent_sequence"],
        "current_ball": ball_package,
        "commentary": [all_match_commentary[-len(commentary_entries):][i] for i in range(len(commentary_entries))],
        "compression_occurred": compression_occurred,
        "key_insights": global_insights
    }
    
    await manager.broadcast(payload)
    return payload

@app.post("/api/simulate-ball")
async def simulate_ball():
    """Trigger a single ball simulation manually."""
    if simulator.match_over:
        return {"status": "finished", "message": "Match has already concluded."}
    
    payload = await process_ball_and_broadcast()
    return {"status": "success", "data": payload}

async def auto_simulation_loop():
    """Background loop that simulates a ball every 12 seconds if autoloop is enabled."""
    global auto_sim_task
    logger.info("Starting automatic ball simulation background loop.")
    while auto_sim_task and not simulator.match_over:
        await process_ball_and_broadcast()
        # Wait 12 seconds per ball to give enough time for the TTS audio to speak out
        await asyncio.sleep(12)
    
    auto_sim_task = False
    logger.info("Automatic ball simulation background loop stopped.")

@app.post("/api/start-auto-simulation")
def start_auto_simulation(background_tasks: BackgroundTasks):
    """Starts the auto ball simulation loop."""
    global auto_sim_task
    if simulator.match_over:
        return {"status": "finished", "message": "Match is already over."}
    
    if auto_sim_task:
        return {"status": "running", "message": "Auto simulation is already running."}
        
    auto_sim_task = True
    background_tasks.add_task(auto_simulation_loop)
    return {"status": "success", "message": "Auto simulation loop started."}

@app.post("/api/stop-auto-simulation")
def stop_auto_simulation():
    """Stops the auto ball simulation loop."""
    global auto_sim_task
    auto_sim_task = False
    return {"status": "success", "message": "Auto simulation loop stopped."}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time scorecard and commentary streaming."""
    await manager.connect(websocket)
    try:
        # Send initial state immediately upon connecting
        initial_state = simulator.get_full_state()
        initial_state["key_insights"] = global_insights
        initial_state["commentary_history"] = all_match_commentary[-15:]
        await websocket.send_json({
            "event": "connection_established",
            "state": initial_state
        })
        
        while True:
            # Maintain connection alive, listen for any client messages
            data = await websocket.receive_text()
            # If client requests a manual sync
            if data == "sync":
                state = simulator.get_full_state()
                state["key_insights"] = global_insights
                state["commentary_history"] = all_match_commentary[-15:]
                await websocket.send_json({
                    "event": "sync",
                    "state": state
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket)
