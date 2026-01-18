"use client";

import React, { useState } from 'react';
import { Shell } from '../../components/ui/Shell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Input';

export default function PipelinesPage() {
  const [filter, setFilter] = useState('All');

  const pipelines = [
    { id: '1042', name: 'ecommerce-api', branch: 'main', status: 'Success', duration: '5m 12s', lastRun: '2 mins ago', provider: 'GitHub' },
    { id: '1041', name: 'auth-service', branch: 'develop', status: 'Failed', duration: '1m 05s', lastRun: '12 mins ago', provider: 'GitHub' },
    { id: '1040', name: 'billing-engine', branch: 'master', status: 'Success', duration: '3m 45s', lastRun: '45 mins ago', provider: 'GitLab' },
    { id: '1039', name: 'web-front', branch: 'main', status: 'Success', duration: '4m 20s', lastRun: '1 hour ago', provider: 'GitHub' },
    { id: '1038', name: 'data-worker', branch: 'prod', status: 'Running', duration: '2m 10s', lastRun: 'Just now', provider: 'Jenkins' },
  ];

  return (
    <Shell activePage="Pipelines">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Pipelines</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Monitor and manage connected software delivery workflows.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary">Import Repository</Button>
          <Button>Create Pipeline</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        {['All', 'Active', 'Failed', 'Recent'].map((tag) => (
          <Button 
            key={tag} 
            variant={filter === tag ? 'primary' : 'secondary'} 
            size="sm"
            onClick={() => setFilter(tag)}
          >
            {tag}
          </Button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {pipelines.map((p) => (
          <Card key={p.id} glass={false} style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto auto', alignItems: 'center', gap: '40px', padding: '24px 32px' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '10px', 
                backgroundColor: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>

              <div>
                <a href={`/pipelines/${p.id}`} style={{ fontSize: '16px', fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'block', marginBottom: '4px' }}>
                  {p.name}
                </a>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {p.provider} • <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{p.branch}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Status</div>
                <span style={{ 
                  color: p.status === 'Success' ? 'var(--success)' : p.status === 'Failed' ? 'var(--error)' : 'var(--accent-cyan)',
                  fontSize: '13px',
                  fontWeight: 700
                }}>
                  {p.status}
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Duration</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.duration}</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Last Ran</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.lastRun}</div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="secondary" size="sm" onClick={() => window.location.href=`/pipelines/${p.id}`}>Analyze</Button>
                <Button variant="secondary" size="sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h.01"/><path d="M12 12h.01"/><path d="M12 4h.01"/></svg>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
