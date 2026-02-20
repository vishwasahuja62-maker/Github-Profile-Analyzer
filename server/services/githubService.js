const axios = require('axios');

const GITHUB_API_URL = 'https://api.github.com';
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

const getHeaders = () => {
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
};

const fetchWithCache = async (url) => {
    const cached = cache.get(url);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.data;
    }
    const response = await axios.get(url, { headers: getHeaders() });
    cache.set(url, { data: response.data, timestamp: Date.now() });
    return response.data;
};

const fetchUserData = async (username) => {
    try {
        // 1. Fetch Core Data (User, Repos, Orgs)
        const [user, repos, orgs] = await Promise.all([
            fetchWithCache(`${GITHUB_API_URL}/users/${username}`),
            fetchWithCache(`${GITHUB_API_URL}/users/${username}/repos?per_page=100&sort=updated`),
            fetchWithCache(`${GITHUB_API_URL}/users/${username}/orgs`)
        ]);

        // 2. Process Repositories
        let totalStars = 0;
        let forks = 0;
        const languages = {};
        let lastUpdated = null;
        const topics = new Set();

        repos.forEach(repo => {
            totalStars += repo.stargazers_count;
            forks += repo.forks_count;

            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }

            if (repo.topics) {
                repo.topics.forEach(t => topics.add(t));
            }

            const updatedAt = new Date(repo.updated_at);
            if (!lastUpdated || updatedAt > lastUpdated) {
                lastUpdated = updatedAt;
            }
        });

        const sortedLanguages = Object.entries(languages)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // 3. Advanced Activity Logic
        const now = new Date();
        const accountAgeDays = Math.floor((now - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
        const diffDays = lastUpdated ? Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24)) : 999;

        let activityLevel = 'Low';
        let activityBonus = 0;

        if (diffDays <= 7) {
            activityLevel = 'High';
            activityBonus = 50;
        } else if (diffDays <= 30) {
            activityLevel = 'Medium';
            activityBonus = 25;
        }

        // 4. Enhanced Developer Score Calculation
        // Base components: Repos (2pts), Stars (3pts), Followers (2pts), Forks (1pt)
        // Multipliers: Activity Bonus, Org Bonus (10pts per org), Account Age Loyalty
        const orgBonus = orgs.length * 15;
        const ageLoyalty = Math.min(accountAgeDays / 365, 5) * 10; // Max 50 points for age

        const rawScore = (user.public_repos * 2) + (totalStars * 3) + (user.followers * 2) + (forks * 1) + activityBonus + orgBonus + ageLoyalty;
        const developerScore = Math.round(rawScore);

        return {
            profile: {
                name: user.name,
                username: user.login,
                avatarUrl: user.avatar_url,
                bio: user.bio,
                location: user.location,
                followers: user.followers,
                following: user.following,
                publicRepos: user.public_repos,
                htmlUrl: user.html_url,
                createdAt: user.created_at,
                organizations: orgs.map(o => ({ login: o.login, avatarUrl: o.avatar_url })),
            },
            stats: {
                totalStars,
                totalForks: forks,
                totalRepos: user.public_repos,
                developerScore,
                activityLevel,
                languages: sortedLanguages.slice(0, 5),
                topTopics: Array.from(topics).slice(0, 10),
                topRepos: repos
                    .sort((a, b) => b.stargazers_count - a.stargazers_count)
                    .slice(0, 5)
                    .map(repo => ({
                        name: repo.name,
                        stars: repo.stargazers_count,
                        language: repo.language,
                        url: repo.html_url
                    }))
            }
        };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch GitHub data');
    }
};

module.exports = {
    fetchUserData,
};
