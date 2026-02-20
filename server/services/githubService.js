const axios = require('axios');

const GITHUB_API_URL = 'https://api.github.com';
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

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

const analyzePersonality = (repos) => {
    const updateHours = repos.map(r => new Date(r.updated_at).getHours());
    const lateNight = updateHours.filter(h => h >= 22 || h <= 4).length;
    const earlyBird = updateHours.filter(h => h >= 5 && h <= 9).length;

    if (lateNight > repos.length * 0.4) return "Night Owl Coder";
    if (earlyBird > repos.length * 0.4) return "Early Bird Builder";

    const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
    if (totalStars > 500) return "Open Source Rockstar";

    const forksCount = repos.reduce((acc, r) => acc + r.forks_count, 0);
    if (forksCount > 100) return "Collaboration Maven";

    return "Solo Architect";
};

const generateAIReview = (user, stats, repos) => {
    const strengths = [];
    const weaknesses = [];

    if (user.followers > 100) strengths.push("Strong community presence");
    if (stats.totalStars > 50) strengths.push("Significant project impact (High Stars)");
    if (stats.activityLevel === 'High') strengths.push("Very consistent contribution frequency");
    if (user.public_repos > 30) strengths.push("Highly prolific project builder");

    if (user.bio === null || user.bio === "") weaknesses.push("Missing profile bio");
    if (stats.totalStars < 5) weaknesses.push("Low project visibility/engagement");
    if (stats.activityLevel === 'Low') weaknesses.push("Decreased recent activity/commits");

    const readmeCount = repos.filter(r => r.description).length;
    if (readmeCount < repos.length * 0.5) weaknesses.push("Incomplete repo descriptions (README quality)");

    let score = Math.min(10, (stats.developerScore / 100) + 1);
    score = Math.round(score * 10) / 10;

    return {
        rating: score,
        strengths,
        weaknesses,
        suggestion: score > 8 ? "Keep building and mentoring others!" : "Improve your profile READMEs and increase commit frequency."
    };
};

const fetchUserData = async (username) => {
    try {
        const [user, repos, orgs] = await Promise.all([
            fetchWithCache(`${GITHUB_API_URL}/users/${username}`),
            fetchWithCache(`${GITHUB_API_URL}/users/${username}/repos?per_page=100&sort=updated`),
            fetchWithCache(`${GITHUB_API_URL}/users/${username}/orgs`)
        ]);

        let totalStars = 0;
        let forks = 0;
        const languages = {};
        let lastUpdated = null;
        const topics = new Set();
        const repoHealth = [];

        repos.forEach(repo => {
            totalStars += repo.stargazers_count;
            forks += repo.forks_count;

            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }

            if (repo.topics) {
                repo.topics.forEach(t => topics.add(t));
            }

            // Repo Health Check
            const healthScore = (repo.stargazers_count > 0 ? 1 : 0) +
                (repo.license ? 1 : 0) +
                (repo.description ? 1 : 0) +
                (new Date() - new Date(repo.updated_at) < 1000 * 60 * 60 * 24 * 30 ? 1 : 0);

            repoHealth.push({
                name: repo.name,
                health: healthScore >= 3 ? 'Good' : 'Poor',
                stars: repo.stargazers_count,
                license: repo.license ? repo.license.name : 'N/A',
                updatedAt: repo.updated_at
            });

            const updatedAt = new Date(repo.updated_at);
            if (!lastUpdated || updatedAt > lastUpdated) {
                lastUpdated = updatedAt;
            }
        });

        const sortedLanguages = Object.entries(languages)
            .map(([name, count]) => ({
                name,
                count,
                percentage: Math.round((count / repos.length) * 100)
            }))
            .sort((a, b) => b.count - a.count);

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

        const orgBonus = orgs.length * 15;
        const ageLoyalty = Math.min(accountAgeDays / 365, 5) * 10;

        const rawScore = (user.public_repos * 2) + (totalStars * 3) + (user.followers * 2) + (forks * 1) + activityBonus + orgBonus + ageLoyalty;
        const developerScore = Math.round(Math.min(rawScore, 1000)); // Capped at 1000 for visuals

        const stats = {
            totalStars,
            totalForks: forks,
            totalRepos: user.public_repos,
            developerScore,
            activityLevel,
            languages: sortedLanguages.slice(0, 5),
            topTopics: Array.from(topics).slice(0, 10),
            repoHealth: repoHealth.slice(0, 5),
            personality: analyzePersonality(repos),
            topRepos: repos
                .sort((a, b) => b.stargazers_count - a.stargazers_count)
                .slice(0, 5)
                .map(repo => ({
                    name: repo.name,
                    stars: repo.stargazers_count,
                    language: repo.language,
                    url: repo.html_url
                }))
        };

        const aiReview = generateAIReview(user, stats, repos);

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
            stats,
            aiReview,
            resumeInsight: `A ${stats.personality} specialized in ${sortedLanguages[0]?.name || 'various technologies'} with a portfolio of ${user.public_repos} projects and over ${totalStars} stars collected.`
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
