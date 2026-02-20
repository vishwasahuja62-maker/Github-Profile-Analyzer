import React, { useState } from 'react';
import {
  Search,
  Book,
  Star,
  Users,
  Trophy,
  ExternalLink,
  MapPin,
  Github,
  TrendingUp,
  Activity,
  Code
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchGitHubUser(username);
      setUserData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch user. Please try again.');
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const getActivityBadgeClass = (level) => {
    switch (level) {
      case 'High': return 'activity-high';
      case 'Medium': return 'activity-medium';
      case 'Low': return 'activity-low';
      default: return 'activity-low';
    }
  };

  return (
    <div className="app-container">
      <header className="animate-fade-in">
        <div className="logo">
          <Github size={48} className="icon-main" />
        </div>
        <h1>GitHub Profile Analyzer</h1>
        <p className="subtitle">Discover the full potential of any developer profile</p>

        <form className="search-container" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Enter GitHub username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Analyzing...' : (
              <>
                <Search size={20} />
                Analyze
              </>
            )}
          </button>
        </form>
      </header>

      {error && (
        <div className="error-message animate-fade-in">
          {error}
        </div>
      )}

      {loading && !userData && (
        <div className="dashboard-grid">
          <div className="card skeleton" style={{ height: '400px' }}></div>
          <div>
            <div className="stats-row">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card skeleton" style={{ height: '80px' }}></div>
              ))}
            </div>
            <div className="card skeleton" style={{ height: '400px', marginTop: '20px' }}></div>
          </div>
        </div>
      )}

      {userData && (
        <main className="animate-fade-in">
          <div className="dashboard-grid">
            {/* Sidebar: Profile Info */}
            <aside>
              <div className="card profile-card">
                <img src={userData.profile.avatarUrl} alt={userData.profile.name} className="avatar" />
                <h2 className="profile-name">{userData.profile.name || userData.profile.username}</h2>
                <a
                  href={userData.profile.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-username"
                >
                  @{userData.profile.username}
                </a>

                {userData.profile.bio && (
                  <p className="profile-bio">{userData.profile.bio}</p>
                )}

                {userData.profile.location && (
                  <div className="profile-stats" style={{ justifyContent: 'center', marginBottom: '1rem', color: '#94a3b8' }}>
                    <MapPin size={16} />
                    <span style={{ fontSize: '0.9rem' }}>{userData.profile.location}</span>
                  </div>
                )}

                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-value">{userData.profile.followers}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{userData.profile.following}</span>
                    <span className="stat-label">Following</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{userData.profile.publicRepos}</span>
                    <span className="stat-label">Repos</span>
                  </div>
                </div>

                <div style={{ width: '100%', marginTop: '1rem' }}>
                  <span className={`activity-badge ${getActivityBadgeClass(userData.stats.activityLevel)}`}>
                    <Activity size={14} />
                    {userData.stats.activityLevel} Activity
                  </span>
                </div>

                <a
                  href={userData.profile.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="search-button"
                  style={{ marginTop: '2rem', width: '100%', justifyContent: 'center', textDecoration: 'none' }}
                >
                  View on GitHub
                  <ExternalLink size={16} />
                </a>
              </div>
            </aside>

            {/* Main Content: Stats & Charts */}
            <section>
              <div className="stats-row">
                <StatsCard
                  icon={Book}
                  label="Total Repositories"
                  value={userData.stats.totalRepos}
                  color="#6366f1"
                />
                <StatsCard
                  icon={Star}
                  label="Total Stars"
                  value={userData.stats.totalStars}
                  color="#f59e0b"
                />
                <StatsCard
                  icon={Users}
                  label="Followers"
                  value={userData.profile.followers}
                  color="#10b981"
                />
                <StatsCard
                  icon={Trophy}
                  label="Developer Score"
                  value={userData.stats.developerScore}
                  color="#22d3ee"
                />
              </div>

              <div className="charts-container">
                <div className="card chart-card">
                  <h3>
                    <Code size={20} color="#6366f1" />
                    Language Distribution
                  </h3>
                  <LanguagePieChart languages={userData.stats.languages} />
                </div>
                <div className="card chart-card">
                  <h3>
                    <TrendingUp size={20} color="#f59e0b" />
                    Top Repositories by Stars
                  </h3>
                  <RepoBarChart repos={userData.stats.topRepos} />
                </div>
              </div>

              <div className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="#10b981" />
                  Recent Performance Insights
                </h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  This user has a <strong>Developer Score of {userData.stats.developerScore}</strong>.
                  Based on recent activity, the engagement level is <strong>{userData.stats.activityLevel}</strong>.
                  {userData.stats.totalStars > 10 ? ' They have a solid repository of projects with significant community interest.' : ' They are actively building their portfolio.'}
                  Most of their work is done in <strong>{userData.stats.languages[0]?.name || 'various languages'}</strong>.
                </p>
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
