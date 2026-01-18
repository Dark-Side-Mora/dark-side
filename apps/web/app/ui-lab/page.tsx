"use client";

import React from 'react';
import { Shell } from '../../components/ui/Shell';
import { Button } from '../../components/ui/Button';
import { Card, Input } from '../../components/ui/Input';

const ModalPreview = ({ title, children }: any) => (
  <div style={{
    width: '100%',
    maxWidth: '500px',
    backgroundColor: 'var(--bg-sidebar)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    marginBottom: '40px'
  }}>
    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{title}</h3>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </div>
    <div style={{ padding: '32px' }}>{children}</div>
    <div style={{ padding: '20px 32px', backgroundColor: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
      <Button variant="secondary">Cancel</Button>
      <Button>Confirm Action</Button>
    </div>
  </div>
);

const ToastPreview = ({ variant, message, subtext }: any) => {
  const iconColor = variant === 'success' ? 'var(--success)' : variant === 'error' ? 'var(--error)' : 'var(--accent-cyan)';
  return (
    <div style={{ 
      width: '320px', 
      padding: '16px', 
      borderRadius: '12px', 
      backgroundColor: 'var(--bg-sidebar)', 
      border: `1px solid ${iconColor}33`,
      display: 'flex',
      gap: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      marginBottom: '20px'
    }}>
      <div style={{ 
        width: '36px', 
        height: '36px', 
        borderRadius: '50%', 
        backgroundColor: `${iconColor}11`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: iconColor,
        flexShrink: 0
      }}>
        {variant === 'success' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        {variant === 'error' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>{message}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{subtext}</div>
      </div>
    </div>
  );
};

export default function UILabPage() {
  return (
    <Shell activePage="Dashboard">
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>UI Elements (Figma Library)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Capture these modular components for your Figma design system.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>
        <div>
          <h4 style={{ fontSize: '16px', color: 'var(--accent-cyan)', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dialogs & Modals</h4>
          
          <ModalPreview title="Create New Pipeline">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input label="Pipeline Name" placeholder="e.g. production-deploy" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input label="Environment" placeholder="Production" />
                <Input label="Schedule" placeholder="Daily" />
              </div>
              <Input label="Repository URL" placeholder="https://github.com/org/repo" />
            </div>
          </ModalPreview>

          <ModalPreview title="Confirm Deletion">
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Are you sure you want to delete the pipeline <span style={{ color: '#fff', fontWeight: 600 }}>main-web-prod</span>? This action is irreversible and will stop all active jobs.
            </p>
          </ModalPreview>
        </div>

        <div>
          <h4 style={{ fontSize: '16px', color: 'var(--accent-cyan)', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Notifications & Alerts</h4>
          
          <ToastPreview 
            variant="success" 
            message="Deployment Successful" 
            subtext="Version v1.2.4 is now live on Staging."
          />
          <ToastPreview 
            variant="error" 
            message="Build Failed" 
            subtext="Critical error in step: Run Unit Tests."
          />
          <ToastPreview 
            variant="info" 
            message="New Security Update" 
            subtext="A new scan revealed 3 high-risk findings."
          />

          <Card title="Context Menu Preview" style={{ width: '200px', padding: '8px', marginTop: '40px' }}>
            {['View Details', 'Rerun Pipeline', 'Archive', 'Delete'].map((item, i) => (
              <div key={item} style={{ 
                padding: '10px 12px', 
                fontSize: '13px', 
                borderRadius: '6px', 
                cursor: 'pointer',
                backgroundColor: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: item === 'Delete' ? 'var(--error)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                {item}
                {i === 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
