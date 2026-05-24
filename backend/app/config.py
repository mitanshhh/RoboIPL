import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
    PORT = int(os.getenv("PORT", 8000))
    HOST = os.getenv("HOST", "127.0.0.1")
    
    # Audio settings
    AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "audio")
    
    # Ensure audio directory exists
    os.makedirs(AUDIO_DIR, exist_ok=True)

config = Config()
