"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './Button';

// --- Icons (Inline SVGs for Figma compatibility) ---
const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 2L2 9L2 23L16 30L30 23L30 9L16 2Z" fill="url(#logo-grad)" fillOpacity="0.1" stroke="url(#logo-grad)" strokeWidth="2"/>
    <path d="M16 8V24" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12L16 16L24 12" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="16" r="3" fill="var(--accent-cyan)"/>
    <defs>
      <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06B6D4" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
);
const IconProjects = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M12 12V4"/><path d="M2 12h20"/><path d="M7 16h0"/><path d="M12 16h0"/><path d="M17 16h0"/></svg>
);
const IconExplorer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M13 2v7h7"/><path d="M9 18h6"/><path d="M9 14h6"/><path d="M9 10h1"/></svg>
);
const IconSecurity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);
const IconAnalytics = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
);
const IconLearning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M12 6v4"/><path d="M12 14v4"/></svg>
);
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconSun = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);
const IconMoon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

const IconMenu = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  );

export const Shell = ({ children, activePage }: { children: React.ReactNode, activePage: string }) => {
  // Initialize from localStorage if available, default to true (dark mode)
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    // Apply theme class to body and save to localStorage
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const menuItems = [
    { name: 'Dashboard', icon: <IconDashboard />, path: '/' },
    { name: 'Projects', icon: <IconProjects />, path: '/projects' },
    { name: 'Run Explorer', icon: <IconExplorer />, path: '/explorer' },
    { name: 'Security', icon: <IconSecurity />, path: '/security' },
    { name: 'Analytics', icon: <IconAnalytics />, path: '/analytics' },
    { name: 'Learning Hub', icon: <IconLearning />, path: '/learning' },
    { name: 'Settings', icon: <IconSettings />, path: '/settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="mobile-only"
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 45, backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Sidebar */}
      <div 
        className={isSidebarOpen ? 'sidebar-visible' : 'sidebar-hidden desktop-only'} 
        style={{
          width: '260px',
          height: '100vh',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LogoIcon />
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            CI-Insight
          </h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => (
            <a key={item.name} href={item.path} onClick={() => setIsSidebarOpen(false)} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: activePage === item.name ? (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)') : 'transparent',
              color: activePage === item.name ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              border: activePage === item.name ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
              textDecoration: 'none'
            }}>
              {item.icon}
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</span>
            </a>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--accent-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>DD</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Damindu De Silva</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pro License</div>
            </div>
          </div>
        </div>
      </div>

      <main 
        className="main-content-expanded"
        style={{ 
          marginLeft: '260px', 
          flex: 1, 
          position: 'relative',
          width: 'calc(100% - 260px)',
          transition: 'margin-left 0.3s ease, width 0.3s ease'
        }}>
        <header style={{
          height: '72px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          backgroundColor: isDarkMode ? 'rgba(9, 9, 11, 0.8)' : 'rgba(252, 252, 253, 0.9)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger for mobile */}
            <button 
              className="mobile-only"
              onClick={() => setIsSidebarOpen(true)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', marginRight: '8px', display: 'none'
              }}
            >
              <IconMenu />
            </button>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }} className="desktop-only">Organization:</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Main Hub</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" className="desktop-only"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <button 
               onClick={toggleTheme}
               style={{
                 width: '40px',
                 height: '40px',
                 borderRadius: '10px',
                 border: '1px solid var(--border)',
                 backgroundColor: 'rgba(255, 255, 255, 0.03)',
                 color: 'var(--text-primary)',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 transition: 'all 0.2s ease'
               }}
             >
               {isDarkMode ? <IconSun /> : <IconMoon />}
             </button>
             <div className="desktop-only" style={{ display: 'flex', gap: '12px' }}>
                <Button size="sm" variant="secondary" onClick={() => window.open('https://github.com/Dark-Side-Mora', '_blank')}>Docs</Button>
                <Button size="sm" onClick={() => window.location.href='/projects'}>Connect Repository</Button>
             </div>
          </div>
        </header>
        <div style={{ padding: '24px' }}>{children}</div>
      </main>
    </div>
  );
};
