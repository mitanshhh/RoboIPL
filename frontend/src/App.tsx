import { useState, useEffect, useCallback, useRef } from 'react';
import { Scoreboard } from './components/Scoreboard';
import { PlayerCard } from './components/PlayerCard';
import { CommentaryFeed } from './components/CommentaryFeed';
import { AudioPlayer } from './components/AudioPlayer';
import { OverSummary } from './components/OverSummary';
import type { FullState, CommentaryEntry } from './types';

function App() {
  // Connection and loop states
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [autoSimulate, setAutoSimulate] = useState<boolean>(false);
  const [isSimulatingBall, setIsSimulatingBall] = useState<boolean>(false);
  const [compressionAlert, setCompressionAlert] = useState<boolean>(false);

  // Match and Commentary States
  const [matchState, setMatchState] = useState<FullState['match_state']>({
    batting_team: 'MI',
    bowling_team: 'RR',
    runs: 135,
    wickets: 3,
    overs: 15.0,
    target: 185,
    runs_needed: 50,
    balls_remaining: 30,
    required_run_rate: 10.0,
    current_run_rate: 9.0,
    match_over: false,
    match_result: '',
    is_over_completed: false,
  });

  const [partnership, setPartnership] = useState<FullState['partnership']>({
    batsmen: ['Hardik Pandya', 'Tilak Varma'],
    runs: 43,
    balls: 28,
  });

  const [playerStats, setPlayerStats] = useState<FullState['player_stats']>({
    MI: {
      'Hardik Pandya': { name: 'Hardik Pandya', runs: 15, balls: 10, fours: 1, sixes: 1, out: false, strike_rate: 150 },
      'Tilak Varma': { name: 'Tilak Varma', runs: 28, balls: 18, fours: 2, sixes: 1, out: false, strike_rate: 155.6 },
    },
    RR: {
      'Ravichandran Ashwin': { name: 'Ravichandran Ashwin', overs: 3, runs: 28, wickets: 1, economy: 9.33 },
    },
  });

  const [recentSequence, setRecentSequence] = useState<string[]>([]);
  const [keyInsights, setKeyInsights] = useState<string[]>([
    'MI need 50 runs off 30 balls at Wankhede Stadium.',
    'Ashwin is starting the death-overs spell for Rajasthan Royals.',
  ]);

  const [commentaryHistory, setCommentaryHistory] = useState<CommentaryEntry[]>([]);
  const [audioQueue, setAudioQueue] = useState<CommentaryEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<CommentaryEntry | null>(null);
  const [activeCommentIndex, setActiveCommentIndex] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Sync state from server REST API
  const fetchInitialState = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/state');
      if (res.ok) {
        const data = await res.json();
        updateStatesFromPayload(data);
      }
    } catch (err) {
      console.error('Failed to fetch initial state:', err);
    }
  };

  const updateStatesFromPayload = (data: any) => {
    if (data.match_state) setMatchState(data.match_state);
    if (data.partnership) setPartnership(data.partnership);
    if (data.player_stats) setPlayerStats(data.player_stats);
    if (data.recent_sequence) setRecentSequence(data.recent_sequence);
    if (data.key_insights) setKeyInsights(data.key_insights);
    if (data.commentary_history) {
      setCommentaryHistory(data.commentary_history);
      // Initialize audio queue with past elements if needed, or keep empty
    }
  };

  // Setup WebSocket connection
  useEffect(() => {
    fetchInitialState();

    const connectWebSocket = () => {
      console.log('Connecting to WebSocket...');
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const hostname = window.location.hostname;
      const wsUrl = `${protocol}://${hostname}:8000/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connected.');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        console.log('WS Message received:', payload);

        if (payload.event === 'connection_established' || payload.event === 'sync') {
          updateStatesFromPayload(payload.state);
        } else if (payload.event === 'reset') {
          updateStatesFromPayload(payload.state);
          setCommentaryHistory([]);
          setAudioQueue([]);
          setActiveEntry(null);
          setActiveCommentIndex(null);
          setIsAudioPlaying(false);
          setAutoSimulate(false);
        } else if (payload.event === 'ball_event') {
          // Update match details
          if (payload.match_state) setMatchState(payload.match_state);
          if (payload.partnership) setPartnership(payload.partnership);
          if (payload.player_stats) setPlayerStats(payload.player_stats);
          if (payload.recent_sequence) setRecentSequence(payload.recent_sequence);
          if (payload.key_insights) setKeyInsights(payload.key_insights);

          // Append commentary entries
          if (payload.commentary && payload.commentary.length > 0) {
            setCommentaryHistory((prev) => [...prev, ...payload.commentary]);
            // Push new commentaries to audio playing queue
            setAudioQueue((prev) => [...prev, ...payload.commentary]);
          }

          // Trigger context compression flash alert
          if (payload.compression_occurred) {
            setCompressionAlert(true);
            setTimeout(() => setCompressionAlert(false), 5000);
          }
        }
      };

      ws.onclose = () => {
        console.warn('WebSocket Closed. Retrying in 3 seconds...');
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  // Action Buttons handlers
  const handleSimulateBall = async () => {
    if (matchState.match_over || isSimulatingBall) return;
    setIsSimulatingBall(true);
    try {
      await fetch('http://127.0.0.1:8000/api/simulate-ball', { method: 'POST' });
    } catch (err) {
      console.error('Error simulating ball:', err);
    } finally {
      setIsSimulatingBall(false);
    }
  };

  const handleToggleAutoSim = async () => {
    const endpoint = autoSimulate ? '/api/stop-auto-simulation' : '/api/start-auto-simulation';
    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, { method: 'POST' });
      if (res.ok) {
        const nextAutoSimulate = !autoSimulate;
        setAutoSimulate(nextAutoSimulate);
        
        // If we just stopped the commentary loop, stop the current audio and clear the queue immediately
        if (!nextAutoSimulate) {
          setIsAudioPlaying(false);
          setAudioQueue([]);
          setActiveEntry(null);
          setActiveCommentIndex(null);
        }
      }
    } catch (err) {
      console.error('Error toggling auto simulation:', err);
    }
  };

  const handleResetMatch = async () => {
    if (window.confirm('Are you sure you want to reset the match to 15.0 overs?')) {
      try {
        await fetch('http://127.0.0.1:8000/api/reset', { method: 'POST' });
      } catch (err) {
        console.error('Error resetting match:', err);
      }
    }
  };

  // Play audio item on demand from clicks
  const handlePlayCommentaryOnDemand = (entry: CommentaryEntry) => {
    // Find index in commentary history to highlight properly
    const index = commentaryHistory.findIndex(
      (c) => c.text === entry.text && c.agent === entry.agent
    );
    
    // Play it as a single-item audio override
    setActiveEntry(entry);
    setActiveCommentIndex(index);
    setIsAudioPlaying(true);
  };

  const handleActiveAudioChange = useCallback((entry: CommentaryEntry | null, index: number | null) => {
    setActiveEntry(entry);
    if (entry && index !== null) {
      // Correct absolute index in commentaryHistory based on relative index in queue
      const globalIdx = commentaryHistory.findIndex(
        (c) => c.text === entry.text && c.agent === entry.agent
      );
      setActiveCommentIndex(globalIdx >= 0 ? globalIdx : null);
    } else {
      setActiveCommentIndex(null);
    }
  }, [commentaryHistory]);

  const activeBatter = playerStats.MI[partnership.batsmen[0]] || { name: partnership.batsmen[0], runs: 0, balls: 0, fours: 0, sixes: 0, strike_rate: 0 };
  const currentBowlerName = Object.keys(playerStats.RR)[0] || 'Avesh Khan';
  const activeBowler = playerStats.RR[currentBowlerName] || { name: currentBowlerName, overs: 0, runs: 0, wickets: 0, economy: 0 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Premium Sports Header */}
      <header className="glass-panel" style={{
        margin: '20px 20px 0 20px',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(13, 19, 33, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>🏏</span>
          <div>
            <h1 style={{
              fontSize: '1.4rem',
              background: 'linear-gradient(90deg, #60a5fa 0%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800'
            }}>
              AGENTIC PREMIER LEAGUE
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              IPL Live Multi-Agent Cognitive Commentary System
            </span>
          </div>
        </div>

        {/* Live status indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
          {/* WebSocket Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#ef4444',
              boxShadow: isConnected ? '0 0 8px #10b981' : 'none'
            }} />
            <span style={{ color: isConnected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {isConnected ? 'LIVE FEED SYNCED' : 'RECONNECTING...'}
            </span>
          </div>

          {/* Auto sim Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: autoSimulate ? '#3b82f6' : 'var(--text-muted)',
              boxShadow: autoSimulate ? '0 0 8px #3b82f6' : 'none',
              animation: autoSimulate ? 'pulse-mi 1.5s infinite' : 'none'
            }} />
            <span style={{ color: autoSimulate ? '#60a5fa' : 'var(--text-muted)' }}>
              {autoSimulate ? 'AUTO BROADCAST ACTIVE' : 'LOOP STANDBY'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Studio Dashboard Workspace */}
      <main className="app-grid" style={{ flex: 1 }}>
        
        {/* Left Column: Live Scores, Player Profiles, commentary panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Score Card Header */}
          <Scoreboard matchState={matchState} />

          {/* Live Audio Control Bar */}
          <AudioPlayer
            queue={audioQueue}
            activeEntry={activeEntry}
            onActiveChange={handleActiveAudioChange}
            isPlaying={isAudioPlaying}
            setIsPlaying={setIsAudioPlaying}
          />

          {/* Active Batter & Bowler Stats */}
          <PlayerCard
            batsman={{ ...activeBatter, name: partnership.batsmen[0] }}
            bowler={{ ...activeBowler, name: currentBowlerName }}
          />

          {/* Scrollable Dialogue Panel */}
          <CommentaryFeed
            history={commentaryHistory}
            onPlayAudio={handlePlayCommentaryOnDemand}
            activeCommentIndex={activeCommentIndex}
          />
        </div>

        {/* Right Column: Control Desk & Over Statistics summaries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Studio Control Desk */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              🎛️ STUDIO CONTROL DESK
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Play Single Ball Button */}
              <button
                onClick={handleSimulateBall}
                disabled={matchState.match_over || isSimulatingBall || autoSimulate}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--mi-blue) 0%, rgba(96, 165, 250, 0.8) 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: (matchState.match_over || isSimulatingBall || autoSimulate) ? 'not-allowed' : 'pointer',
                  opacity: (matchState.match_over || isSimulatingBall || autoSimulate) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0, 94, 166, 0.25)',
                  transition: 'var(--transition)'
                }}
              >
                {isSimulatingBall ? (
                  <>⌛ GENERATING PANEL DISCUSSIONS...</>
                ) : (
                  <>⚾ PLAY BALL DELIVERY</>
                )}
              </button>

              {/* Autoloop simulation Button */}
              <button
                onClick={handleToggleAutoSim}
                disabled={matchState.match_over}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: autoSimulate 
                    ? 'rgba(215, 26, 96, 0.15)' 
                    : 'linear-gradient(135deg, var(--rr-pink) 0%, rgba(244, 114, 182, 0.8) 100%)',
                  border: autoSimulate ? '1.5px solid var(--rr-pink)' : 'none',
                  color: autoSimulate ? 'var(--rr-pink)' : '#fff',
                  fontWeight: '700',
                  cursor: matchState.match_over ? 'not-allowed' : 'pointer',
                  opacity: matchState.match_over ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: autoSimulate ? 'none' : '0 4px 12px rgba(215, 26, 96, 0.25)',
                  transition: 'var(--transition)'
                }}
              >
                {autoSimulate ? (
                  <>⏹️ STOP LIVE COMMENTARY LOOP</>
                ) : (
                  <>🎙️ START LIVE COMMENTARY LOOP</>
                )}
              </button>

              {/* Reset Session Button */}
              <button
                onClick={handleResetMatch}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'none',
                  border: '1.5px dashed rgba(255,255,255,0.15)',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                🔄 RESET MATCH SESSION
              </button>
            </div>
          </div>

          {/* Context Compression Alert Box */}
          {compressionAlert && (
            <div className="glass-panel" style={{
              padding: '16px 20px',
              background: 'rgba(255, 170, 0, 0.1)',
              border: '1.5px solid var(--rag-gold)',
              boxShadow: '0 0 15px rgba(255, 170, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'boundary-flash 1.5s ease-in-out',
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚡</span>
              <div>
                <strong style={{ color: 'var(--rag-gold)', fontSize: '0.85rem', display: 'block' }}>CONTEXT COMPRESSION PERFORMED</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Old dialogue has been summarized into cognitive insights to maintain history under 500 tokens!
                </span>
              </div>
            </div>
          )}

          {/* Over Summaries and Insights */}
          <OverSummary recentSequence={recentSequence} keyInsights={keyInsights} />
        </div>
      </main>

      {/* Styled Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid rgba(255,255,255,0.03)'
      }}>
        IPL Live Multi-Agent Cognitive Commentary System | Developed with Gemini Flash 1.5 & ElevenLabs
      </footer>
    </div>
  );
}

export default App;
