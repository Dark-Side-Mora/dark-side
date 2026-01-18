"use client";

import React from 'react';
import { Shell } from '../../components/ui/Shell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Input';

export default function SecurityPage() {
  const findings = [
    { severity: 'CRITICAL', title: 'Hardcoded AWS Credentials', file: 'infra/deploy-task.yml', line: 124, status: 'Open', category: 'Secrets' },
    { severity: 'HIGH', title: 'Over-privileged IAM Role', file: 'iam/base-role.json', line: 12, status: 'In Review', category: 'Access Control' },
    { severity: 'HIGH', title: 'Vulnerable Base Image (alpine:3.12)', file: 'Dockerfile', line: 1, status: 'Patching', category: 'Infrastructure' },
    { severity: 'MEDIUM', title: 'Insecure redirect in Nginx config', file: 'nginx/prod.conf', line: 42, status: 'Open', category: 'Configuration' },
    { severity: 'LOW', title: 'Root user enabled in Docker', file: 'Dockerfile', line: 45, status: 'Open', category: 'Best Practice' },
  ];

  return (
    <Shell activePage="Security">
      <div className="security-grid">
        <style jsx>{`
          .security-grid {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 32px;
          }
          .finding-row {
            display: flex;
            align-items: center;
            padding: 20px 24px;
            gap: 24px;
          }
          .finding-actions {
             display: flex;
             gap: 12px;
          }
          @media (max-width: 1024px) {
            .security-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 768px) {
            .finding-row {
               flex-direction: column;
               align-items: flex-start;
               gap: 16px;
            }
            .finding-actions {
               width: 100%;
               justify-content: flex-end;
            }
          }
        `}</style>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Security Analyzer</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Automated configuration auditing and vulnerability management.</p>
            </div>
            <Button>Scan Repository</Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {findings.map((f, i) => (
              <Card key={i} glass={false} style={{ padding: '0', overflow: 'hidden' }}>
                 <div className="finding-row">
                  <div style={{ 
                    width: '4px', 
                    height: '40px', 
                    backgroundColor: f.severity === 'CRITICAL' ? 'var(--error)' : f.severity === 'HIGH' ? 'var(--warning)' : 'var(--accent-purple)',
                    borderRadius: '2px',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '12px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0 }}>ID: VULN-{1000 + i}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 800, 
                        color: f.severity === 'CRITICAL' ? 'var(--error)' : f.severity === 'HIGH' ? 'var(--warning)' : 'var(--accent-purple)'
                      }}>
                        {f.severity}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{f.file}:{f.line}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>•</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.category}</span>
                    </div>
                  </div>
                  <div className="finding-actions">
                    <Button variant="secondary" size="sm">Remediate</Button>
                    <Button variant="ghost" size="sm">Ignore</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Security Scoreboard">
             <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 24px' }}>
              <svg width="180" height="180" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--error)" strokeWidth="10" strokeDasharray="282.7" strokeDashoffset="70" strokeLinecap="round" transform="rotate(-90 50 50)" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 800 }}>B-</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Grade</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Critical Issues', value: 1, color: 'var(--error)' },
                { label: 'High Priority', value: 2, color: 'var(--warning)' },
                { label: 'Compliance Checks', value: '18/24', color: 'var(--success)' },
              ].map((stat) => (
                <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                  <span style={{ fontWeight: 600, color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Suggested Actions (AI)">
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Gemini has identified <strong>3 major risks</strong> in your Docker configurations. 
              The most critical is the usage of an outdated base image in <code>Dockerfile:1</code>.
            </p>
            <Button variant="secondary" style={{ width: '100%' }}>View Patch Strategy</Button>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
