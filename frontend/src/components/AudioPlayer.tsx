import React, { useState, useEffect, useRef } from 'react';
import type { CommentaryEntry } from '../types';

interface AudioPlayerProps {
  queue: CommentaryEntry[];
  activeEntry: CommentaryEntry | null;
  onActiveChange: (entry: CommentaryEntry | null, index: number | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  queue,
  activeEntry,
  onActiveChange,
  isPlaying,
  setIsPlaying,
}) => {
  const [volume, setVolume] = useState<number>(0.8);
  const [muted, setMuted] = useState<boolean>(false);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isAudioSpeaking, setIsAudioSpeaking] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Play next item in queue when current finishes
  const handlePlaybackFinished = () => {
    loggerInfo("Playback finished. Advancing queue.");
    setIsAudioSpeaking(false);
    
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
    } else {
      // End of queue reached
      setIsPlaying(false);
      onActiveChange(null, null);
    }
  };

  const loggerInfo = (msg: string) => {
    console.log(`[AudioPlayer] ${msg}`);
  };

  // Listen for changes to the incoming queue
  useEffect(() => {
    if (queue.length === 0) {
      setQueueIndex(-1);
      stopAllPlayback();
      return;
    }
    // If the player was not playing but new items were added, auto start from the new items
    if (queue.length > 0 && queueIndex === -1) {
      setQueueIndex(0);
      setIsPlaying(true);
    } else if (queue.length > 0 && !isPlaying && queueIndex >= queue.length - 1) {
      // If we finished before, but new items arrive, resume playback on the new item
      setQueueIndex(queue.length - 1);
      setIsPlaying(true);
    }
  }, [queue]);

  // Handle active item changes based on queueIndex
  useEffect(() => {
    if (queueIndex >= 0 && queueIndex < queue.length) {
      const entry = queue[queueIndex];
      onActiveChange(entry, queueIndex);
      if (isPlaying) {
        playEntry(entry);
      }
    } else {
      onActiveChange(null, null);
    }
  }, [queueIndex, isPlaying]);

  // Stop everything if paused
  useEffect(() => {
    if (!isPlaying) {
      stopAllPlayback();
    } else if (queueIndex >= 0 && queueIndex < queue.length && !isAudioSpeaking) {
      playEntry(queue[queueIndex]);
    }
  }, [isPlaying]);

  const stopAllPlayback = () => {
    // Stop HTML Audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // Stop Web Speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAudioSpeaking(false);
  };

  const playEntry = (entry: CommentaryEntry) => {
    stopAllPlayback();
    setIsAudioSpeaking(true);

    if (!entry.audio_url || entry.use_browser_tts) {
      // Fallback: Use Web Speech API
      loggerInfo(`Speaking via browser synthesis: "${entry.text_to_speak}"`);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Clear any pending speech
        
        const utterance = new SpeechSynthesisUtterance(entry.text_to_speak);
        utterance.volume = muted ? 0 : volume;
        // Slow down speech synthesis playback rates for Hinglish clarity
        utterance.rate = entry.agent === 'MI Agent' ? 0.85 : entry.agent === 'RR Agent' ? 0.82 : 0.80;
        
        // Select appropriate voice based on gender and agent
        const voices = window.speechSynthesis.getVoices();
        const genderMatched = voices.find(v => {
          const name = v.name.toLowerCase();
          if (entry.gender === 'female') {
            return name.includes('female') || name.includes('google us english') || name.includes('zira') || name.includes('samantha');
          } else {
            return name.includes('male') || name.includes('david') || name.includes('google uk english male');
          }
        });

        if (genderMatched) {
          utterance.voice = genderMatched;
        }

        utterance.onend = () => {
          handlePlaybackFinished();
        };

        utterance.onerror = (e) => {
          console.error("SpeechSynthesis error:", e);
          handlePlaybackFinished();
        };

        speechUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        loggerInfo("Web Speech API not supported in browser.");
        // Skip ahead immediately
        handlePlaybackFinished();
      }
    } else {
      // Standard: Play ElevenLabs MP3 File from backend
      const fullUrl = entry.audio_url.startsWith('http') 
        ? entry.audio_url 
        : `${window.location.protocol}//${window.location.hostname}:8000${entry.audio_url}`;
      
      loggerInfo(`Playing cached MP3: ${fullUrl}`);
      const audio = new Audio(fullUrl);
      audio.volume = muted ? 0 : volume;
      audio.defaultPlaybackRate = 0.88; // Slow down audio speed to 88%
      
      audio.onended = () => {
        handlePlaybackFinished();
      };
      
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        handlePlaybackFinished();
      };
      
      audioRef.current = audio;
      audio.play().then(() => {
        if (audioRef.current) {
          audioRef.current.playbackRate = 0.88; // Re-apply rate once playback starts
        }
      }).catch(err => {
        console.warn("Failed to autoplay audio due to browser gestures restriction:", err);
        // If autoplay fails, fallback to speech or advance
        handlePlaybackFinished();
      });
    }
  };

  // Adjust volume on active audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const toggleMute = () => {
    setMuted(!muted);
  };

  const getAgentColor = (agent?: string) => {
    switch (agent) {
      case 'MI Agent':
        return 'var(--mi-blue)';
      case 'RR Agent':
        return 'var(--rr-pink)';
      case 'RAG Expert':
        return 'var(--rag-gold)';
      default:
        return 'var(--border-glass)';
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      flexWrap: 'wrap',
      border: activeEntry ? `1px solid ${getAgentColor(activeEntry.agent)}` : '1px solid var(--border-glass)',
      boxShadow: activeEntry ? `0 0 15px ${getAgentColor(activeEntry.agent)}50` : 'none',
      transition: 'var(--transition)'
    }}>
      {/* Speaking Agent details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${activeEntry ? getAgentColor(activeEntry.agent) : 'var(--border-glass)'}`,
          animation: isPlaying && isAudioSpeaking ? 'pulse-mi 1.5s infinite' : 'none',
          fontSize: '1.2rem'
        }}>
          {activeEntry ? (activeEntry.agent === 'MI Agent' ? '🦁' : activeEntry.agent === 'RR Agent' ? '👑' : '🧠') : '🎙️'}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {activeEntry ? `NOW SPEAKING: ${activeEntry.agent}` : 'AI PANEL STANDBY'}
          </span>
          <p style={{
            fontSize: '0.85rem',
            color: activeEntry ? '#fff' : 'var(--text-muted)',
            maxWidth: '300px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {activeEntry ? activeEntry.text : 'Click "Play Simulation" or trigger a ball to begin.'}
          </p>
        </div>
      </div>

      {/* Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: isPlaying ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--mi-blue) 0%, var(--rr-pink) 100%)',
            border: 'none',
            outline: 'none',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: isPlaying ? 'none' : '0 4px 12px rgba(215, 26, 96, 0.4)',
            transition: 'var(--transition)'
          }}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="4" width="4" height="16" /><rect x="16" y="4" width="4" height="16" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        {/* Skip Button */}
        <button
          onClick={() => {
            const nextIdx = queueIndex + 1;
            if (nextIdx < queue.length) {
              setQueueIndex(nextIdx);
            }
          }}
          disabled={queueIndex >= queue.length - 1}
          style={{
            background: 'none',
            border: 'none',
            color: queueIndex >= queue.length - 1 ? 'var(--text-muted)' : '#fff',
            cursor: queueIndex >= queue.length - 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
        </button>

        {/* Volume controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '16px' }}>
          <button
            onClick={toggleMute}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setMuted(false);
            }}
            style={{
              width: '70px',
              accentColor: 'var(--mi-blue)',
              background: 'rgba(255,255,255,0.1)',
              height: '4px',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
    </div>
  );
};
