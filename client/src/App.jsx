import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Book, Star, Users, Trophy, ExternalLink, MapPin,
  Github, TrendingUp, Activity, Code, GitFork, Hash,
  History, X, GitCompare, Calendar, Zap, AlertTriangle,
  CheckCircle, Download, FileText, Share2, Sparkles, LogOut, Layout
} from 'lucide-react';
import VanillaTilt from 'vanilla-tilt';
import { GitHubCalendar } from 'react-github-calendar';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { fetchGitHubUser } from './services/api';
import StatsCard from './components/StatsCard';
import LanguagePieChart from './components/Charts/LanguagePieChart';
import RepoBarChart from './components/Charts/RepoBarChart';

function App() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [history, setHistory] = useState([]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const dashboardRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gh_analyzer_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  useEffect(() => {
    if (userData || compareData) {
      const cards = document.querySelectorAll('.card');
      if (cards.length > 0) {
        VanillaTilt.init(Array.from(cards), {
          max: 5,
          speed: 400,
          glare: true,
          'max-glare': 0.1,
        });
      }
    }
  }, [userData, compareData]);

  const addToHistory = (user) => {
    const newItem = { username: user.profile.username, avatarUrl: user.profile.avatarUrl };
    const updated = [newItem, ...history.filter(h => h.username !== user.profile.username)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('gh_analyzer_history', JSON.stringify(updated));
  };

  const handleLogout = () => {
    setUserData(null);
    setCompareData(null);
    setHistory([]);
    localStorage.removeItem('gh_analyzer_history');
    setError(null);
    setUsername('');
  };

  const handleSearch = async (e, customUser = null) => {
    if (e) e.preventDefault();
    const targetUser = customUser || username;
    if (!targetUser.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGitHubUser(targetUser);
      if (isCompareMode && userData) {
        setCompareData(data);
      } else {
        setUserData(data);
        setCompareData(null);
        addToHistory(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'User not found or API Limit reached.');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${userData.profile.username}_report.pdf`);
  };

  const generatePortfolio = () => {
    const { profile, stats, aiReview } = userData;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profile.name || profile.username} | Portfolio</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&family=Outfit:wght@800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root {
            --primary: #6366f1;
            --accent: #a855f7;
            --bg: #030712;
            --card: rgba(255, 255, 255, 0.03);
            --border: rgba(255, 255, 255, 0.08);
            --text: #f9fafb;
            --text-muted: #94a3b8;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: var(--bg);
            color: var(--text);
            font-family: 'Plus Jakarta Sans', sans-serif;
            line-height: 1.6;
            overflow-x: hidden;
        }
        .mesh-bg {
            fixed: inset 0; z-index: -1; position: fixed; width: 100vw; height: 100vh;
            background: radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
        }
        .container { max-width: 1100px; margin: 0 auto; padding: 4rem 2rem; }
        header { text-align: center; margin-bottom: 6rem; animation: slideUp 1s ease-out; }
        .avatar { width: 180px; height: 180px; border-radius: 60px; border: 2px solid var(--border); margin-bottom: 2rem; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5); }
        h1 { font-family: 'Outfit', sans-serif; font-size: 4.5rem; letter-spacing: -2px; margin-bottom: 1rem; background: linear-gradient(135deg, #fff 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .bio { font-size: 1.25rem; color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 6rem; }
        .card { background: var(--card); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 32px; padding: 2.5rem; transition: 0.4s; }
        .card:hover { transform: translateY(-10px); border-color: rgba(255,255,255,0.2); }
        .stat-val { font-size: 3rem; font-weight: 800; display: block; color: var(--primary); }
        .stat-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); }
        .section-title { font-size: 2.5rem; margin-bottom: 3rem; font-family: 'Outfit', sans-serif; }
        .projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; }
        .project-card { position: relative; overflow: hidden; }
        .project-name { font-size: 1.5rem; margin-bottom: 1rem; color: #fff; }
        .tech-tag { background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 0.4rem 1rem; border-radius: 99px; font-size: 0.8rem; font-weight: 600; }
        footer { text-align: center; margin-top: 10rem; color: var(--text-muted); font-size: 0.9rem; padding-bottom: 4rem; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) { h1 { font-size: 3rem; } .stats-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="mesh-bg"></div>
    <div class="container">
        <header>
            <img src="${profile.avatarUrl}" class="avatar" alt="${profile.name}">
            <h1>${profile.name || profile.username}</h1>
            <p class="bio">${profile.bio || 'Crafting digital experiences with precision and passion.'}</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <span class="tech-tag" style="background: rgba(168, 85, 247, 0.1); color: var(--accent); padding: 0.75rem 1.5rem; font-size: 1rem;">
                    <i data-lucide="sparkles" style="width: 18px; vertical-align: middle; margin-right: 8px;"></i>
                    ${stats.personality}
                </span>
            </div>
        </header>

        <div class="stats-grid">
            <div class="card">
                <span class="stat-val">${stats.developerScore}</span>
                <span class="stat-label">Developer Rating</span>
            </div>
            <div class="card">
                <span class="stat-val">${stats.totalStars}</span>
                <span class="stat-label">GitHub Impact</span>
            </div>
            <div class="card">
                <span class="stat-val">${stats.totalRepos}</span>
                <span class="stat-label">Project Count</span>
            </div>
        </div>

        <section>
            <h2 class="section-title">Featured Ecosystems</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 6rem;">
                ${stats.languages.map(l => `
                    <div class="card" style="padding: 1.5rem 2.5rem; border-radius: 20px;">
                        <span style="font-weight: 800; font-size: 1.25rem;">${l.name}</span>
                        <div style="height: 4px; width: 100%; background: rgba(255,255,255,0.05); margin-top: 0.5rem; border-radius: 2px;">
                            <div style="height: 100%; width: ${l.percentage}%; background: var(--primary); border-radius: 2px;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>

        <section>
            <h2 class="section-title">Selected Projects</h2>
            <div class="projects-grid">
                ${stats.repoHealth.map(repo => `
                    <div class="card project-card">
                        <h3 class="project-name">${repo.name}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Verified repository with <strong>${repo.health} Health</strong> status.</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="tech-tag">${repo.license !== 'N/A' ? repo.license : 'Open Source'}</span>
                            <span style="font-weight: 700;">★ ${repo.stars}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>

        <footer>
            <p>Generated by GitHub Pro Analyzer &bull; 2026</p>
        </footer>
    </div>
    <script>lucide.createIcons();</script>
</body>
</html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.username}_portfolio.html`;
    a.click();
  };

  const ProfileColumn = ({ data }) => (
    <aside className="profile-card card animate-fade-in">
      <img src={data.profile.avatarUrl} alt={data.profile.name} className="profile-avatar shadow-xl" />
      <h2 className="profile-name">{data.profile.name || data.profile.username}</h2>
      <a href={data.profile.htmlUrl} target="_blank" rel="noopener noreferrer" className="profile-username flex items-center justify-center gap-2">
        @{data.profile.username} <ExternalLink size={14} />
      </a>
      <div style={{ margin: '1.5rem 0' }}>
        <span className="personality-tag" style={{ background: 'rgba(129, 140, 248, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }}>
          <Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {data.stats.personality}
        </span>
      </div>
      {data.profile.bio && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>{data.profile.bio}</p>}
      <div className="profile-stats">
        <div className="stat-item"><span className="stat-value">{data.profile.followers}</span><span className="stat-label">Fans</span></div>
        <div className="stat-item"><span className="stat-value">{data.profile.publicRepos}</span><span className="stat-label">Repos</span></div>
        <div className="stat-item"><span className="stat-value">{data.stats.totalStars}</span><span className="stat-label">Stars</span></div>
      </div>
      <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid var(--glass-border)' }}>
        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '2px', fontWeight: 800 }}>Resume Insight</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.8', fontStyle: 'italic' }}>"{data.resumeInsight}"</p>
      </div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: '2.5rem' }} onClick={generatePortfolio}>
        <Download size={18} /> Generate Portfolio
      </button>
    </aside>
  );

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <Github size={32} className="text-gradient animate-pulse" />
            <span className="app-name">GHA Elite</span>
          </div>
        </div>

        <nav className="nav-section">
          <button
            className={`nav-item ${!isCompareMode ? 'active' : ''}`}
            onClick={() => setIsCompareMode(false)}
          >
            <Layout size={18} /> <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${isCompareMode ? 'active' : ''}`}
            onClick={() => setIsCompareMode(true)}
          >
            <GitCompare size={18} /> <span>Compare Mode</span>
          </button>

          <div className="nav-divider"></div>

          {history.length > 0 && (
            <>
              <div className="nav-label">Recent Intelligence</div>
              {history.map(item => (
                <button
                  key={item.username}
                  className="nav-item"
                  onClick={() => handleSearch(null, item.username)}
                >
                  <div className="avatar-small" style={{ width: 24, height: 24, borderRadius: 6 }}>
                    <img src={item.avatarUrl} alt={item.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span>{item.username}</span>
                </button>
              ))}
            </>
          )}

          <div className="nav-divider" style={{ marginTop: 'auto' }}></div>

          <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <LogOut size={18} /> <span>Sign Out</span>
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header-bar animate-fade-in">
          <div className="welcome-text">
            <h1>{userData ? `${userData.profile.name || userData.profile.username}'s Intelligence` : 'Developer Intelligence'}</h1>
            <p>{userData ? `Deep ecosystem breakdown for ${userData.profile.username}` : 'High-fidelity AI-driven GitHub ecosystem analysis.'}</p>
          </div>
          <div className="user-profile">
            {userData && (
              <>
                <button className="btn btn-outline" onClick={exportPDF}>
                  <Download size={18} /> Export PDF
                </button>
                <div className="avatar-small" style={{ width: 56, height: 56, borderRadius: 16 }}>
                  <img src={userData.profile.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </>
            )}
          </div>
        </header>

        <div className="search-section card animate-fade-in" style={{ marginBottom: '3rem' }}>
          <form className="learning-input-container" onSubmit={(e) => handleSearch(e)}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ marginLeft: '12px', color: 'var(--text-muted)' }} />
              <input
                className="learning-input"
                placeholder={isCompareMode ? "Username to compare..." : "Analyze GitHub username (e.g. torvalds)..."}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (isCompareMode && userData ? 'Compare' : 'Analyze')}
            </button>
          </form>
          {error && <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>{error}</p>}
        </div>

        {loading && !userData && (
          <div style={{ textAlign: 'center', marginTop: '5rem' }}>
            <div className="animate-spin-slow" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto', border: '5px solid var(--primary)', borderTopColor: 'transparent' }}></div>
            <h2 style={{ marginTop: '2rem', color: 'var(--text-secondary)', letterSpacing: '3px', fontSize: '0.85rem', fontWeight: 800 }}>DECODING DEVELOPER DNA...</h2>
          </div>
        )}

        {!userData && !loading && (
          <div className="welcome-card animate-fade-in">
            <div className="logo-large"><Github size={120} className="text-gradient animate-pulse" /></div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Elite Intelligence Engine</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8' }}>
              Enter a GitHub username above to generate a deep AI-driven analysis of their technical personality, repo health, and professional impact.
            </p>
          </div>
        )}

        {isCompareMode && userData && compareData && (
          <div className="animate-fade-in">
            <div className="compare-container relative">
              <ProfileColumn data={userData} />
              <div className="compare-v">VS</div>
              <ProfileColumn data={compareData} />
            </div>

            <div className="card" style={{ marginTop: '3rem' }}>
              <h3 className="section-title text-gradient" style={{ marginBottom: '2.5rem' }}><TrendingUp size={24} /> Performance Battle Matrix</h3>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>{userData.profile.username}</th>
                    <th>{compareData.profile.username}</th>
                    <th>Dominance</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Dev Power', userData.stats.developerScore, compareData.stats.developerScore],
                    ['Public Repos', userData.profile.publicRepos, compareData.profile.publicRepos],
                    ['Total Stars', userData.stats.totalStars, compareData.stats.totalStars],
                    ['Followers', userData.profile.followers, compareData.profile.followers],
                  ].map(([label, v1, v2]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td style={{ fontWeight: 800, fontSize: '1.1rem' }}>{v1}</td>
                      <td style={{ fontWeight: 800, fontSize: '1.1rem' }}>{v2}</td>
                      <td>
                        <span style={{
                          color: v1 > v2 ? 'var(--success)' : v1 === v2 ? 'var(--warning)' : 'var(--accent)',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.8rem',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '8px'
                        }}>
                          {v1 > v2 ? userData.profile.username : v1 === v2 ? 'Draw' : compareData.profile.username}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <button className="btn btn-outline" onClick={() => setCompareData(null)}>Reset Battlefield</button>
              </div>
            </div>
          </div>
        )}

        {userData && (!isCompareMode || !compareData) && (
          <div className="animate-fade-in" ref={dashboardRef}>
            <div className="dashboard-grid">
              <ProfileColumn data={userData} />

              <section>
                <div className="card ai-review-card" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                    <h3 className="section-title" style={{ margin: 0 }}><Sparkles size={24} className="text-gradient" /> Neural Analysis Review</h3>
                    <div className="rating-badge text-gradient">{userData.aiReview.rating}</div>
                  </div>

                  <div className="ai-review-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                    <div>
                      <h4 style={{ color: 'var(--success)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px' }}><CheckCircle size={18} /> DISTINCTIVE STRENGTHS</h4>
                      <ul style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', listStyle: 'none' }}>
                        {userData.aiReview.strengths.map(s => <li key={s} style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--success)' }}>•</span> {s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px' }}><AlertTriangle size={18} /> CRITICAL GROWTH AREAS</h4>
                      <ul style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', listStyle: 'none' }}>
                        {userData.aiReview.weaknesses.map(w => <li key={w} style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--danger)' }}>•</span> {w}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: '2.5rem', padding: '1.5rem 2rem', background: 'rgba(129, 140, 248, 0.05)', borderRadius: '24px', border: '1px solid rgba(129, 140, 248, 0.1)' }}>
                    <p style={{ fontSize: '1.05rem', color: 'white', lineHeight: '1.8' }}>
                      <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>Neural Suggestion:</strong> {userData.aiReview.suggestion}
                    </p>
                  </div>
                </div>

                <div className="stats-row">
                  <StatsCard icon={Zap} label="Dev Score" value={userData.stats.developerScore} color="var(--primary)" />
                  <StatsCard icon={Star} label="Star Impact" value={userData.stats.totalStars} color="var(--warning)" />
                  <StatsCard icon={GitFork} label="Bridge Count" value={userData.stats.totalForks} color="var(--success)" />
                  <StatsCard icon={Activity} label="Pulse Grade" value={userData.stats.activityLevel} color="var(--accent)" />
                </div>

                <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div className="card">
                    <h3 className="section-title"><Code size={20} className="text-gradient" /> Ecosystem Mastery</h3>
                    <LanguagePieChart languages={userData.stats.languages} />
                  </div>
                  <div className="card">
                    <h3 className="section-title"><TrendingUp size={20} className="text-gradient" /> Repo Performance</h3>
                    <RepoBarChart repos={userData.stats.topRepos || []} />
                  </div>
                </div>

                <div className="card" style={{ marginBottom: '2.5rem' }}>
                  <h3 className="section-title"><Calendar size={20} className="text-gradient" /> Contribution Velocity</h3>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                    <GitHubCalendar username={userData.profile.username} colorScheme="dark" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div className="card">
                    <h3 className="section-title text-gradient"><CheckCircle size={20} /> Integrity Scan</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {userData.stats.repoHealth.map(repo => (
                        <div key={repo.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{repo.name}</span>
                          <span className={`health-badge health-${repo.health.toLowerCase()}`}>{repo.health}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <h3 className="section-title text-gradient"><Hash size={20} /> Domain Ecosystems</h3>
                    <div className="topic-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {userData.stats.topTopics?.map(topic => (
                        <span key={topic} className="topic-tag" style={{ background: 'rgba(129, 140, 248, 0.1)', color: 'var(--primary)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.5px' }}>#{topic.toUpperCase()}</span>
                      ))}
                      {(!userData.stats.topTopics || userData.stats.topTopics.length === 0) && <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Multi-disciplinary Specialist</span>}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1.5s linear infinite;
        }
        .personality-tag {
          transition: 0.3s;
        }
        .personality-tag:hover {
          background: rgba(129, 140, 248, 0.2) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

export default App;
