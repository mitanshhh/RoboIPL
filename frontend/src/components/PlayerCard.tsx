import React from 'react';
import type { Batsman, Bowler } from '../types';

interface PlayerCardProps {
  batsman: Batsman & { name: string };
  bowler: Bowler & { name: string };
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ batsman, bowler }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
      
      {/* Current Batsman (MI) Card */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge badge-mi">STRIKER</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mumbai Indians</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Stylized Batter Avatar */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--mi-blue) 0%, rgba(96, 165, 250, 0.4) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 94, 166, 0.3)'
          }}>
            {/* Batter silhouette or elegant initial */}
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>🏏</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{batsman.name}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>All-rounder</span>
          </div>
        </div>

        {/* Batsman Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Runs (Balls)</span>
            <h4 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '4px' }}>
              {batsman.runs} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '400' }}>({batsman.balls})</span>
            </h4>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Strike Rate</span>
            <h4 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '4px' }}>{batsman.strike_rate}</h4>
          </div>
        </div>

        {/* Boundaries Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>4s: </span>
            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{batsman.fours}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>6s: </span>
            <strong style={{ color: 'var(--mi-gold)', fontSize: '0.95rem' }}>{batsman.sixes}</strong>
          </div>
        </div>
      </div>

      {/* Current Bowler (RR) Card */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge badge-rr">BOWLER</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rajasthan Royals</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Stylized Bowler Avatar */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--rr-pink) 0%, rgba(244, 114, 182, 0.4) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(215, 26, 96, 0.3)'
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>🔴</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{bowler.name}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bowler</span>
          </div>
        </div>

        {/* Bowler Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overs / Wkts</span>
            <h4 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '4px' }}>
              {bowler.overs} <span style={{ fontSize: '0.9rem', color: 'var(--rr-pink)', fontWeight: '700' }}>/ {bowler.wickets}</span>
            </h4>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Economy</span>
            <h4 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '4px' }}>{bowler.economy}</h4>
          </div>
        </div>

        {/* Additional Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Runs: </span>
            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{bowler.runs_conceded ?? bowler.runs}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Maidens: </span>
            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>0</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
