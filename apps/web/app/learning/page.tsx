"use client";

import React, { useState, useEffect } from 'react';
import { Shell } from '../../components/ui/Shell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Input';

export default function LearningPage() {
  const [activeModule, setActiveModule] = useState('CI/CD Best Practices');
  const [quizSelection, setQuizSelection] = useState<number | null>(null);
  const [labInput, setLabInput] = useState('');
  const [labStatus, setLabStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [progress, setProgress] = useState(50);

  const modules = [
    { title: 'CI/CD Best Practices', status: 'Completed', length: '15 mins', icon: '🎯' },
    { title: 'Securing Your Pipeline', status: 'In Progress', length: '25 mins', icon: '🛡️' },
    { title: 'Optimizing Build Times', status: 'Not Started', length: '20 mins', icon: '⚡' },
    { title: 'Monitoring & Observability', status: 'Not Started', length: '30 mins', icon: '📊' },
  ];

  const verifyLab = () => {
    if (labInput.includes('${{ secrets.') || labInput.includes('env.SECRET')) {
      setLabStatus('success');
      setProgress(Math.min(100, progress + 5));
    } else {
      setLabStatus('error');
    }
  };

  return (
    <Shell activePage="Learning Hub">
      <div className="learning-grid">
        <style jsx>{`
          .learning-grid {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 32px;
          }
          @media (max-width: 1024px) {
            .learning-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
        <div>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Interactive Learning Hub</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Master DevOps through hands-on labs. Practice "Shift Left" security with CI‑Insight.</p>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Module: {activeModule}</h3>
               <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 700, backgroundColor: 'rgba(6,182,212,0.1)', padding: '4px 12px', borderRadius: '20px' }}>Interactive Lab Active</span>
            </div>
            
            <Card style={{ padding: '32px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ borderLeft: '4px solid var(--accent-cyan)', paddingLeft: '20px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>The Anatomy of a Secure Pipeline</h4>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px' }}>
                    Shift-left security means integrating vulnerability scanning at the earliest possible stage.
                    In this lesson, we explore how <strong>CI‑Insight</strong> identifies secrets committed to source control.
                  </p>
                </div>

                {/* Interactive Knowledge Check */}
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                    KNOWLEDGE CHECK
                  </h5>
                  <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Which method is the most secure for handling cloud provider API keys?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      'Environment variables in .github/workflows/*.yml',
                      'Encrypted Secrets injected at runtime via Vault/KMS',
                      'Private repository variables with Base64 encoding',
                    ].map((opt, i) => (
                      <div 
                        key={i} 
                        onClick={() => setQuizSelection(i)}
                        style={{ 
                          padding: '16px', 
                          borderRadius: '12px', 
                          border: '1px solid',
                          borderColor: quizSelection === i ? (i === 1 ? 'var(--success)' : 'var(--error)') : 'var(--border)', 
                          fontSize: '14px', 
                          cursor: 'pointer',
                          backgroundColor: quizSelection === i ? (i === 1 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)') : 'transparent',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>{opt}</span>
                        {quizSelection === i && (
                          <span style={{ fontWeight: 800, fontSize: '12px', color: i === 1 ? 'var(--success)' : 'var(--error)' }}>
                            {i === 1 ? '✓ CORRECT' : '✗ INCORRECT'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <Button variant="secondary">Previous</Button>
                  <Button disabled={quizSelection !== 1}>Next Lesson</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Interactive Code Lab */}
          <Card title="Live Remediation Lab" style={{ borderColor: labStatus === 'success' ? 'var(--success)' : labStatus === 'error' ? 'var(--error)' : 'var(--border)' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
               <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}><strong>Task:</strong> Refactor the hardcoded access key on line 6 to use a GitHub Secret.</p>
               <Button size="sm" variant="secondary" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hide Hint' : 'Get AI Hint'}</Button>
            </div>

            {showHint && (
              <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid var(--accent-cyan)', marginBottom: '20px', fontSize: '13px' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>Gemini AI Hint:</span> Use the syntax <code style={{ color: '#fff' }}>{"${{ secrets.VAR_NAME }}"}</code> to safely reference repository secrets.
              </div>
            )}

            <div style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '13px', 
              backgroundColor: 'var(--bg-card)', 
              color: 'var(--text-primary)',
              padding: '24px', 
              borderRadius: '16px', 
              border: '1px solid var(--border)',
              lineHeight: '1.8'
            }}>
              <div style={{ opacity: 0.7 }}><span style={{ color: 'var(--accent-cyan)' }}>jobs:</span></div>
              <div style={{ opacity: 0.7 }}>  <span style={{ color: 'var(--accent-cyan)' }}>deploy:</span></div>
              <div style={{ opacity: 0.7 }}>    <span style={{ color: 'var(--accent-cyan)' }}>runs-on:</span> ubuntu-latest</div>
              <div style={{ opacity: 0.7 }}>    <span style={{ color: 'var(--accent-cyan)' }}>steps:</span></div>
              <div style={{ opacity: 0.7 }}>      - <span style={{ color: 'var(--accent-cyan)' }}>name:</span> AWS Auth</div>
              <div style={{ 
                backgroundColor: labStatus === 'success' ? 'rgba(34, 197, 94, 0.1)' : labStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'var(--border)', 
                padding: '4px 12px',
                borderRadius: '4px',
                borderLeft: `2px solid ${labStatus === 'success' ? 'var(--success)' : labStatus === 'error' ? 'var(--error)' : 'var(--warning)'}`
              }}>
                <span style={{ color: 'var(--accent-cyan)' }}>run:</span> aws configure set id {labStatus === 'success' ? <span style={{ color: 'var(--success)' }}>{labInput}</span> : <span style={{ color: 'var(--error)' }}>AKIA_HARDCODED_KEY</span>}
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <input 
                value={labInput}
                onChange={(e) => setLabInput(e.target.value)}
                placeholder="Type the fix... (e.g. ${{ secrets.AWS_KEY }})" 
                style={{ 
                  flex: 1, 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px', 
                  padding: '0 20px', 
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  borderColor: labStatus === 'error' ? 'var(--error)' : 'var(--border)'
                }}
              />
              <Button onClick={verifyLab} variant={labStatus === 'success' ? 'secondary' : 'primary'}>
                {labStatus === 'success' ? '✓ Verified' : 'Verify Fix'}
              </Button>
            </div>

            {labStatus === 'success' && (
              <div style={{ marginTop: '16px', color: 'var(--success)', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                Excellent! You've successfully secured the pipeline. Lesson complete.
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar - Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Module Progression">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <svg width="80" height="80" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="42" fill="none" 
                    stroke="var(--accent-cyan)" strokeWidth="8" 
                    strokeDasharray="263.8" 
                    strokeDashoffset={263.8 - (263.8 * progress / 100)} 
                    strokeLinecap="round" 
                    transform="rotate(-90 50 50)" 
                    style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '18px', fontWeight: 900 }}>{progress}%</div>
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>Mastery</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Level 4 Engineer</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                     <span style={{ color: 'var(--text-secondary)' }}>Security Pulse Score</span>
                     <span style={{ color: 'var(--success)', fontWeight: 700 }}>840 XP</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                     <div style={{ width: '84%', height: '100%', backgroundColor: 'var(--success)', borderRadius: '2px' }} />
                  </div>
               </div>
            </div>
          </Card>

          <Card title="Course Syllabus">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {modules.map((mod) => (
                <div 
                  key={mod.title}
                  onClick={() => setActiveModule(mod.title)}
                  style={{ 
                    padding: '16px', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border)', 
                    cursor: 'pointer',
                    backgroundColor: activeModule === mod.title ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    borderColor: activeModule === mod.title ? 'var(--accent-cyan)' : 'var(--border)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{mod.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{mod.title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{mod.length}</span>
                    <span style={{ color: mod.status === 'Completed' ? 'var(--success)' : mod.status === 'In Progress' ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: 800 }}>
                       {mod.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
