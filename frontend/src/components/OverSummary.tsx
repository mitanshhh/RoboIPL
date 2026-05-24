import React from 'react';

interface OverSummaryProps {
  recentSequence: string[];
  keyInsights: string[];
}

export const OverSummary: React.FC<OverSummaryProps> = ({ recentSequence, keyInsights }) => {
  // Helper to determine bubble color for a ball outcome in the visual row
  const getBallBadgeStyle = (outcomeText: string) => {
    const txt = outcomeText.toLowerCase();
    
    if (txt.includes('out') || txt.includes('wicket')) {
      return {
        bg: 'var(--rr-pink)',
        color: '#fff',
        label: 'W',
        shadow: '0 0 10px var(--rr-pink)'
      };
    }
    if (txt.includes('6 run') || txt.includes('six')) {
      return {
        bg: 'var(--rag-gold)',
        color: '#000',
        label: '6',
        shadow: '0 0 10px var(--rag-gold)'
      };
    }
    if (txt.includes('4 run') || txt.includes('four')) {
      return {
        bg: 'var(--mi-blue)',
        color: '#fff',
        label: '4',
        shadow: '0 0 10px var(--mi-blue)'
      };
    }
    if (txt.includes('0 run') || txt.includes('dot')) {
      return {
        bg: 'rgba(255,255,255,0.05)',
        color: 'var(--text-secondary)',
        label: '•',
        shadow: 'none'
      };
    }
    if (txt.includes('1 run') || txt.includes('single')) {
      return {
        bg: 'rgba(255,255,255,0.15)',
        color: '#fff',
        label: '1',
        shadow: 'none'
      };
    }
    if (txt.includes('2 run') || txt.includes('double')) {
      return {
        bg: 'rgba(255,255,255,0.15)',
        color: '#fff',
        label: '2',
        shadow: 'none'
      };
    }

    // Default label extract
    const match = outcomeText.match(/(\d)\s+run/);
    const label = match ? match[1] : '•';
    return {
      bg: 'rgba(255,255,255,0.1)',
      color: '#fff',
      label: label,
      shadow: 'none'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Visual Over Badge Row */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          CURRENT OVER PROGRESSION
        </span>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
          {recentSequence.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Over starting...</span>
          ) : (
            recentSequence.map((ball, idx) => {
              const badgeStyle = getBallBadgeStyle(ball);
              return (
                <div
                  key={idx}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: badgeStyle.bg,
                    color: badgeStyle.color,
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    boxShadow: badgeStyle.shadow,
                    transition: 'var(--transition)'
                  }}
                  title={ball}
                >
                  {badgeStyle.label}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AI Key Insights Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.95rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🧠 COGNITIVE SYSTEM INSIGHTS
        </h4>
        
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {keyInsights.map((insight, idx) => (
            <li key={idx} style={{
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              lineHeight: '1.4',
              paddingLeft: '14px',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                left: 0,
                top: '6px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--rag-gold)'
              }} />
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Deliveries List */}
      <div className="glass-panel" style={{ padding: '20px', flex: 1 }}>
        <h4 style={{ fontSize: '0.95rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '12px' }}>
          📝 BALL-BY-BALL FEED
        </h4>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '180px',
          overflowY: 'auto'
        }}>
          {recentSequence.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px 0' }}>
              No balls bowled in this inning segment yet.
            </div>
          ) : (
            recentSequence.map((ball, idx) => (
              <div key={idx} style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                padding: '6px 8px',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.01)',
                borderLeft: ball.includes('OUT') ? '3px solid var(--rr-pink)' : ball.includes('six') || ball.includes('four') ? '3px solid var(--mi-blue)' : '3px solid transparent'
              }}>
                {ball}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
