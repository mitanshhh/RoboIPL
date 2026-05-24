import os
import hashlib
import httpx
import logging
from typing import Optional, Dict, Any
from app.config import config

logger = logging.getLogger("tts")
logging.basicConfig(level=logging.INFO)

# ElevenLabs voice settings (using reliable pre-made voices)
# Rachel (Enthusiastic female), Clyde (Deep measured male), Bella (Educational female)
VOICE_MAP = {
    "MI Agent": {
        "voice_id": "21m00Tcm4TlvDq8ikWAM", 
        "gender": "male",
        "stability": 0.5,
        "similarity_boost": 0.75
    },
    "RR Agent": {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  
        "gender": "female",
        "stability": 0.75,
        "similarity_boost": 0.8
    },
    "RAG Expert": {
        "voice_id": "IKne3meq5aSn9XLyUdCD",  
        "gender": "male",
        "stability": 0.8,
        "similarity_boost": 0.85
    }
}

class TTSEngine:
    def __init__(self):
        self.api_key = config.ELEVENLABS_API_KEY
        self.audio_dir = config.AUDIO_DIR
        self.client = httpx.Client(timeout=15.0)

    def clean_text_for_speech(self, text: str) -> str:
        """Expands common abbreviations and formats numbers for natural speech."""
        text = text.replace("SR", "Strike Rate")
        text = text.replace("RR", "Rajasthan Royals")
        text = text.replace("MI", "Mumbai Indians")
        text = text.replace("IPL", "Indian Premier League")
        text = text.replace("DRS", "Decision Review System")
        text = text.replace("LBW", "Leg Before Wicket")
        text = text.replace("/", " for ")  # e.g., 135/3 -> 135 for 3
        return text

    def generate_speech(self, agent_name: str, text: str) -> Dict[str, Any]:
        """
        Generates speech using ElevenLabs and caches the resulting MP3.
        If API key is missing or fails, indicates fallback to Browser Speech synthesis.
        """
        cleaned_text = self.clean_text_for_speech(text)
        voice_info = VOICE_MAP.get(agent_name, VOICE_MAP["RAG Expert"])
        
        # Unique identifier for the audio file based on text and voice
        hash_input = f"{voice_info['voice_id']}_{cleaned_text}".encode('utf-8')
        text_hash = hashlib.md5(hash_input).hexdigest()
        filename = f"{text_hash}.mp3"
        filepath = os.path.join(self.audio_dir, filename)
        
        # Check cache
        if os.path.exists(filepath):
            logger.info(f"Serving cached audio: {filename}")
            return {
                "audio_url": f"/static/audio/{filename}",
                "use_browser_tts": False,
                "gender": voice_info["gender"]
            }

        # Handle missing API key
        if not self.api_key or self.api_key.strip() == "":
            logger.warning("ElevenLabs API Key not found. Falling back to Browser Web Speech API.")
            return {
                "audio_url": None,
                "use_browser_tts": True,
                "gender": voice_info["gender"],
                "text_to_speak": cleaned_text
            }

        try:
            logger.info(f"Requesting speech from ElevenLabs for {agent_name}")
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_info['voice_id']}"
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.api_key
            }
            data = {
                "text": cleaned_text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": voice_info["stability"],
                    "similarity_boost": voice_info["similarity_boost"]
                }
            }
            
            response = self.client.post(url, json=data, headers=headers)
            
            if response.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(response.content)
                logger.info(f"Saved audio cache: {filename}")
                return {
                    "audio_url": f"/static/audio/{filename}",
                    "use_browser_tts": False,
                    "gender": voice_info["gender"]
                }
            else:
                logger.error(f"ElevenLabs API failed with status {response.status_code}: {response.text}")
                return {
                    "audio_url": None,
                    "use_browser_tts": True,
                    "gender": voice_info["gender"],
                    "text_to_speak": cleaned_text
                }
                
        except Exception as e:
            logger.error(f"Error calling ElevenLabs API: {str(e)}")
            return {
                "audio_url": None,
                "use_browser_tts": True,
                "gender": voice_info["gender"],
                "text_to_speak": cleaned_text
            }

tts_engine = TTSEngine()
