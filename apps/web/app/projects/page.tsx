"use client";

import React from 'react';
import { Shell } from '../../components/ui/Shell';
import { Card } from '../../components/ui/Input';

export default function ProjectsPage() {
  const projects = [
    { name: 'ecommerce-api', type: 'Backend', status: 'Healthy', pipelines: 4, coverage: '92%', lastUpdated: '2h ago', icon: '⚙️' },
    { name: 'web-frontend', type: 'Frontend', status: 'Critical', pipelines: 2, coverage: '78%', lastUpdated: '10m ago', icon: '🎨' },
    { name: 'auth-service', type: 'Service', status: 'Healthy', pipelines: 3, coverage: '88%', lastUpdated: '5h ago', icon: '🛰️' },
    { name: 'data-pipeline', type: 'Data', status: 'Warning', pipelines: 1, coverage: '65%', lastUpdated: '1d ago', icon: '📊' },
    { name: 'payment-gateway', type: 'Service', status: 'Healthy', pipelines: 5, coverage: '94%', lastUpdated: '3h ago', icon: '💳' },
    { name: 'admin-panel', type: 'Frontend', status: 'Healthy', pipelines: 2, coverage: '82%', lastUpdated: '6h ago', icon: '🛠️' },
  ];

  return (
    <Shell activePage="Projects">
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Connected Projects</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Enterprise-level view of all repository orchestrations and their current health metrics.</p>
      </div>

      <div className="projects-grid">
        {projects.map((p) => (
          <div 
            key={p.name} 
            onClick={() => window.location.href='/explorer'}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }}
          >
            <Card style={{ 
              height: '100%', 
              border: '1px solid var(--border)',
              transition: 'border-color 0.2s ease, transform 0.2s ease',
              ':hover': { borderColor: 'var(--accent-cyan)', transform: 'translateY(-4px)' } 
            } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '20px' 
                }}>
                  {p.icon}
                </div>
                <div style={{ 
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  backgroundColor: p.status === 'Healthy' ? 'rgba(16, 185, 129, 0.1)' : p.status === 'Critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: p.status === 'Healthy' ? 'var(--success)' : p.status === 'Critical' ? 'var(--error)' : 'var(--warning)',
                  textTransform: 'uppercase'
                }}>
                  {p.status}
                </div>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{p.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{p.type} Application • {p.pipelines} Active Pipelines</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Coverage</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.coverage}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Last Run</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.lastUpdated}</div>
                </div>
              </div>
            </Card>
          </div>
        ))}
        
        <div 
          onClick={() => window.location.href='/settings?tab=Integrations'}
          style={{ 
            border: '2px dashed var(--border)', 
            borderRadius: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '200px', 
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'all 0.2s ease',
            ':hover': { borderColor: 'var(--accent-cyan)', color: 'var(--text-primary)' }
          } as any}
        >
          <span style={{ fontSize: '24px', marginBottom: '8px' }}>+</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Add New Project</span>
        </div>
      </div>

      <style jsx>{`
        div:hover {
          border-color: var(--accent-cyan);
        }
        .projects-grid {
           display: grid;
           grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
           gap: 24px;
        }
        @media (max-width: 768px) {
          .projects-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Shell>
  );
}
