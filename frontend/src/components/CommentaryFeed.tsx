import React, { useEffect, useRef } from 'react';
import type { CommentaryEntry } from '../types';

interface CommentaryFeedProps {
  history: CommentaryEntry[];
  onPlayAudio?: (entry: CommentaryEntry) => void;
  activeCommentIndex?: number | null;
}

export const CommentaryFeed: React.FC<CommentaryFeedProps> = ({ history, onPlayAudio, activeCommentIndex }) => {
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new commentary arrives
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'MI Agent':
        return 'var(--mi-blue)';
      case 'RR Agent':
        return 'var(--rr-pink)';
      case 'RAG Expert':
        return 'var(--rag-gold)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getAgentBadgeClass = (agent: string) => {
    switch (agent) {
      case 'MI Agent':
        return 'badge-mi';
      case 'RR Agent':
        return 'badge-rr';
      case 'RAG Expert':
        return 'badge-rag';
      default:
        return '';
    }
  };

  const getAgentAvatar = (agent: string) => {
    switch (agent) {
      case 'MI Agent':
        return '🦁';
      case 'RR Agent':
        return '👑';
      case 'RAG Expert':
        return '🧠';
      default:
        return '🎙️';
    }
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '420px',
      padding: '20px',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎙️</span> LIVE MULTI-AGENT DISCUSSION PANEL
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-updating ball-by-ball</span>
      </div>

      {/* Commentary Feed Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingRight: '6px'
      }}>
        {history.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            gap: '12px'
          }}>
            <span style={{ fontSize: '2.5rem' }}>🏏</span>
            <p style={{ fontSize: '0.9rem', textAlign: 'center', maxWidth: '300px' }}>
              Waiting for match events... Start the simulation loop or play a ball to hear the multi-agent commentary.
            </p>
          </div>
        ) : (
          history.map((entry, index) => {
            const isActive = activeCommentIndex === index;
            const agentColor = getAgentColor(entry.agent);

            return (
              <div
                key={index}
                onClick={() => onPlayAudio && onPlayAudio(entry)}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: isActive 
                    ? `linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`
                    : 'rgba(255,255,255,0.01)',
                  border: isActive 
                    ? `1px solid ${agentColor}` 
                    : '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  transform: isActive ? 'scale(1.01)' : 'scale(1)',
                  transition: 'var(--transition)',
                  position: 'relative'
                }}
              >
                {/* Active speaker border overlay */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '-1px',
                    left: '-1px',
                    width: '3px',
                    height: 'calc(100% + 2px)',
                    backgroundColor: agentColor,
                    borderRadius: '12px 0 0 12px'
                  }} />
                )}

                {/* Avatar Icon */}
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${agentColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}>
                  {getAgentAvatar(entry.agent)}
                </div>

                {/* Bubble Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${getAgentBadgeClass(entry.agent)}`}>{entry.agent}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Over {entry.over}</span>
                    </div>
                    {/* Play Audio Indicator */}
                    <span style={{ fontSize: '0.8rem', color: isActive ? agentColor : 'var(--text-muted)' }}>
                      {isActive ? '🔊 playing...' : '▶ Click to listen'}
                    </span>
                  </div>
                  
                  <p style={{
                    fontSize: '0.92rem',
                    lineHeight: '1.5',
                    color: isActive ? '#fff' : 'var(--text-primary)',
                    fontWeight: isActive ? '500' : '400'
                  }}>
                    {entry.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
};
