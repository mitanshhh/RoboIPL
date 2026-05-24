import React from 'react';
import type { MatchState } from '../types';

interface ScoreboardProps {
  matchState: MatchState;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ matchState }) => {
  const {
    runs,
    wickets,
    overs,
    target,
    runs_needed,
    balls_remaining,
    required_run_rate,
    current_run_rate,
    match_over,
    match_result,
  } = matchState;

  // Calculate percentage of target achieved
  const progressPercent = Math.min(100, Math.round((runs / target) * 100));

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative neon gradient header line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, var(--mi-blue) 0%, var(--rr-pink) 100%)'
      }} />

      {/* Main Scoreboard layout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        
        {/* Teams & Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* MI Logo Initial */}
          <div className="pulsing-mi" style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--mi-blue) 0%, var(--bg-dark) 100%)',
            border: '2px solid var(--mi-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            color: '#fff',
            fontSize: '1.2rem',
            textShadow: '0 0 8px var(--mi-blue)'
          }}>MI</div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MUMBAI INDIANS CHASE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <h2 style={{ fontSize: '2.5rem', lineHeight: '1', color: '#fff' }}>{runs}/{wickets}</h2>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>({overs} Ov)</span>
            </div>
          </div>

          <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', margin: '0 10px' }}>VS</span>

          {/* RR Logo Initial */}
          <div className="pulsing-rr" style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--rr-pink) 0%, var(--bg-dark) 100%)',
            border: '2px solid var(--rr-pink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            color: '#fff',
            fontSize: '1.2rem',
            textShadow: '0 0 8px var(--rr-pink)'
          }}>RR</div>
        </div>

        {/* Dynamic target/result block */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {match_over ? (
            <div style={{
              background: 'rgba(226, 183, 64, 0.15)',
              border: '1px solid var(--mi-gold)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'var(--mi-gold)',
              fontWeight: '700',
              fontSize: '1.1rem',
              animation: 'boundary-flash 2s infinite'
            }}>
              🏆 {match_result}
            </div>
          ) : (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TARGET: {target}</span>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>
                Need <span style={{ color: 'var(--rr-pink)', fontWeight: '800' }}>{runs_needed}</span> runs in <span style={{ color: '#60a5fa', fontWeight: '800' }}>{balls_remaining}</span> balls
              </h3>
            </>
          )}
        </div>
      </div>

      {/* Progress slider representing score percentage achieved */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          <span>Current Progress ({progressPercent}%)</span>
          <span>Target: {target} runs</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--mi-blue) 0%, var(--rr-pink) 100%)',
            borderRadius: '4px',
            boxShadow: '0 0 10px rgba(0, 94, 166, 0.5)',
            transition: 'width 0.5s ease-out'
          }} />
        </div>
      </div>

      {/* Speedometer Run Rates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>CURRENT RUN RATE</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{current_run_rate}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>REQUIRED RUN RATE</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: match_over ? 'var(--text-muted)' : 'var(--rr-pink)', marginTop: '4px' }}>
            {match_over ? '0.00' : required_run_rate}
          </span>
        </div>
      </div>
    </div>
  );
};
