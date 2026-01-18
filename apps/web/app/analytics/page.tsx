"use client";

import React from 'react';
import { Shell } from '../../components/ui/Shell';
import { Card } from '../../components/ui/Input';

const LineChart = ({ color = 'var(--accent-cyan)' }) => (
  <svg viewBox="0 0 400 150" style={{ width: '100%', height: '150px' }}>
    <path
      d="M0,120 Q50,80 100,100 T200,40 T300,60 T400,20"
      fill="none"
      stroke={color}
      strokeWidth="3"
    />
    <path
      d="M0,120 Q50,80 100,100 T200,40 T300,60 T400,20 V150 H0 Z"
      fill={`url(#gradient-${color.replace('var(--', '').replace(')', '')})`}
      fillOpacity="0.1"
    />
    <defs>
      <linearGradient id={`gradient-${color.replace('var(--', '').replace(')', '')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor="transparent" />
      </linearGradient>
    </defs>
  </svg>
);

const BarChart = ({ color = 'var(--accent-purple)' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '150px', paddingTop: '20px' }}>
    {[60, 40, 80, 50, 90, 70, 45, 85, 65, 95, 55, 75].map((h, i) => (
      <div 
        key={i} 
        style={{ 
          flex: 1, 
          height: `${h}%`, 
          backgroundColor: color, 
          borderRadius: '4px 4px 0 0',
          opacity: 0.8 
        }} 
      />
    ))}
  </div>
);

export default function AnalyticsPage() {
  return (
    <Shell activePage="Analytics">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Intelligence Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Deep-dive into your CI/CD performance and efficiency metrics.</p>
      </div>

      <div className="analytics-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {[
          { label: 'Avg. Build Time', value: '3m 42s', trend: '↓ 12s', color: 'var(--success)' },
          { label: 'Success Rate', value: '98.5%', trend: '↑ 0.4%', color: 'var(--success)' },
          { label: 'MTTR', value: '24 mins', trend: '↓ 5 mins', color: 'var(--success)' },
          { label: 'Dply Frequency', value: '18/day', trend: '↑ 2', color: 'var(--success)' },
        ].map((m) => (
          <Card key={m.label}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{m.value}</div>
            <div style={{ fontSize: '11px', color: m.color, marginTop: '4px' }}>{m.trend} from last week</div>
          </Card>
        ))}
      </div>

      <div className="charts-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Card title="Build Reliability Trend">
          <div style={{ padding: '20px 0' }}>
            <LineChart color="var(--accent-cyan)" />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '11px', marginTop: '16px' }}>
              <span>WK 1</span><span>WK 2</span><span>WK 3</span><span>WK 4</span><span>WK 5</span><span>WK 6</span>
            </div>
          </div>
        </Card>
        <Card title="Resource Consumption">
          <div style={{ padding: '20px 0' }}>
             <BarChart color="var(--accent-purple)" />
             <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '11px', marginTop: '16px' }}>
              <span>JAN</span><span>JUN</span><span>DEC</span>
            </div>
          </div>
        </Card>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
           .analytics-stats { grid-template-columns: repeat(2, 1fr) !important; }
           .charts-layout { grid-template-columns: 1fr !important; }
           .bottom-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
           .analytics-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        <Card title="Bottleneck Analysis">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'npm install', value: '45s', percent: 70 },
              { label: 'Docker Build', value: '120s', percent: 90 },
              { label: 'Security Scan', value: '30s', percent: 40 },
            ].map(b => (
              <div key={b.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>{b.label}</span>
                  <span style={{ fontWeight: 600 }}>{b.value}</span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${b.percent}%`, backgroundColor: 'var(--accent-pink)', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Failure Categories">
           <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--error)" strokeWidth="12" strokeDasharray="314" strokeDashoffset="240" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--warning)" strokeWidth="12" strokeDasharray="314" strokeDashoffset="280" transform="rotate(30 60 60)" />
            </svg>
            <div style={{ marginLeft: '20px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--error)' }} /> Test (65%)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--warning)' }} /> Lint (20%)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.1)' }} /> Other</div>
            </div>
          </div>
        </Card>
        <Card title="Optimization Insights">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Switching to <strong>ARM64 runners</strong> could reduce build costs by 24% while maintaining similar performance for node-based applications.
          </p>
          <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '16px 0' }} />
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Parallelizing test suites will shave off approximately <strong>52 seconds</strong> from the critical path.
          </p>
        </Card>
      </div>
    </Shell>
  );
}
