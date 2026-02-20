import React, { useState, useEffect } from 'react';
import {
  Search, Book, Star, Users, Trophy, ExternalLink, MapPin,
  Github, TrendingUp, Activity, Code, GitFork, Hash,
  History, X, GitCompare, Calendar
} from 'lucide-react';
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

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gh_analyzer_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addToHistory = (user) => {
    const newItem = {
      username: user.profile.username,
      avatarUrl: user.profile.avatarUrl
    };
    const updated = [newItem, ...history.filter(h => h.username !== user.profile.username)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('gh_analyzer_history', JSON.stringify(updated));
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

  const toggleCompare = () => {
    setIsCompareMode(!isCompareMode);
    if (!isCompareMode) setCompareData(null);
  };

  const ProfileColumn = ({ data, isSmall = false }) => (
    <aside style={isSmall ? { width: '100%' } : {}}>
      <div className="card profile-card">
        <img src={data.profile.avatarUrl} alt={data.profile.name} className="avatar" />
        <h2 className="profile-name">{data.profile.name || data.profile.username}</h2>
        <a href={data.profile.htmlUrl} target="_blank" rel="noopener noreferrer" className="profile-username">
          @{data.profile.username}
        </a>

        {data.profile.bio && <p className="profile-bio">{data.profile.bio}</p>}

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{data.profile.followers}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{data.profile.publicRepos}</span>
            <span className="stat-label">Repos</span>
          </div>
        </div>

        {data.profile.organizations?.length > 0 && (
          <div className="org-list">
            {data.profile.organizations?.map(org => (
              <img key={org.login} src={org.avatarUrl} alt={org.login} title={org.login} className="org-avatar" />
            ))}
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <span className={`activity-badge activity-${data.stats.activityLevel.toLowerCase()}`}>
            <Activity size={14} />
            {data.stats.activityLevel} Activity
          </span>
        </div>

        <div style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
          <Calendar size={14} />
          Joined {new Date(data.profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="app-container">
      {/* History Sidebar */}
      <div className="history-container">
        {history.map(item => (
          <div key={item.username} className="history-item" onClick={() => handleSearch(null, item.username)} title={item.username}>
            <img src={item.avatarUrl} alt={item.username} />
          </div>
        ))}
      </div>

      <header className="animate-fade-in">
        <div className="logo"><Github size={48} /></div>
        <h1>GitHub Profile Analyzer</h1>
        <p className="subtitle">Professional Grade Developer Insights & Comparison</p>

        <div className="search-group" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <form className="search-container" style={{ margin: 0 }} onSubmit={(e) => handleSearch(e)}>
            <input
              type="text"
              className="search-input"
              placeholder={isCompareMode ? "Enter username to compare..." : "Enter GitHub username..."}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button type="submit" className="search-button" disabled={loading}>
              <Search size={20} />
            </button>
          </form>
          <button
            className={`search-button ${isCompareMode ? 'active' : ''}`}
            onClick={toggleCompare}
            style={{ background: isCompareMode ? 'var(--accent)' : 'var(--bg-card)', color: isCompareMode ? 'black' : 'white' }}
          >
            <GitCompare size={20} />
            {isCompareMode ? 'Compare Mode ON' : 'Compare Users'}
          </button>
        </div>
      </header>

      {error && <div className="error-message animate-fade-in">{error}</div>}

      {isCompareMode && userData && compareData ? (
        <div className="animate-fade-in">
          <div className="compare-header">
            <h3>Comparison: @{userData.profile.username} vs @{compareData.profile.username}</h3>
            <button className="close-btn" onClick={() => setCompareData(null)}>Reset Challenger</button>
          </div>
          <div className="compare-container">
            <div className="compare-column">
              <ProfileColumn data={userData} />
              <div className="card" style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Trophy size={32} color="var(--accent)" />
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{userData.stats.developerScore}</div>
                <div className="label">Score</div>
              </div>
            </div>
            <div className="compare-v">VS</div>
            <div className="compare-column">
              <ProfileColumn data={compareData} />
              <div className="card" style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Trophy size={32} color="var(--accent)" />
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{compareData.stats.developerScore}</div>
                <div className="label">Score</div>
              </div>
            </div>
          </div>
        </div>
      ) : userData && (
        <main className="animate-fade-in">
          <div className="dashboard-grid">
            <ProfileColumn data={userData} />

            <section>
              <div className="stats-row">
                <StatsCard icon={Book} label="Public Repos" value={userData.stats.totalRepos} color="#6366f1" />
                <StatsCard icon={Star} label="Total Stars" value={userData.stats.totalStars} color="#f59e0b" />
                <StatsCard icon={GitFork} label="Total Forks" value={userData.stats.totalForks} color="#10b981" />
                <StatsCard icon={Trophy} label="Dev Score" value={userData.stats.developerScore} color="#22d3ee" />
              </div>

              <div className="charts-container">
                <div className="card chart-card">
                  <h3><Code size={20} color="#6366f1" /> Language Mix</h3>
                  <LanguagePieChart languages={userData.stats.languages} />
                </div>
                <div className="card chart-card">
                  <h3><TrendingUp size={20} color="#f59e0b" /> Star Distribution</h3>
                  <RepoBarChart repos={userData.stats.topRepos} />
                </div>
              </div>

              <div className="card">
                <h3><Hash size={20} color="#22d3ee" style={{ marginRight: '0.5rem' }} /> Expert Topics</h3>
                <div className="topic-list">
                  {userData.stats.topTopics?.map(topic => (
                    <span key={topic} className="topic-tag">{topic}</span>
                  ))}
                  {(!userData.stats.topTopics || userData.stats.topTopics.length === 0) && <span style={{ color: '#94a3b8' }}>No topics found</span>}
                </div>
              </div>
            </section>
          </div>
        </main>
      )}

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <div className="skeleton" style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto' }}></div>
          <h2 style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Analyzing Profile...</h2>
        </div>
      )}
    </div>
  );
}

export default App;
