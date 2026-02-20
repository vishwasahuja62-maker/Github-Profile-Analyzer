const axios = require('axios');

const GITHUB_API_URL = 'https://api.github.com';

const getHeaders = () => {
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
};

const fetchUserData = async (username) => {
    try {
        const userResponse = await axios.get(`${GITHUB_API_URL}/users/${username}`, {
            headers: getHeaders(),
        });

        const reposResponse = await axios.get(`${GITHUB_API_URL}/users/${username}/repos?per_page=100&sort=updated`, {
            headers: getHeaders(),
        });

        const user = userResponse.data;
        const repos = reposResponse.data;

        // Calculate stats
        let totalStars = 0;
        const languages = {};
        let lastUpdated = null;

        repos.forEach(repo => {
            totalStars += repo.stargazers_count;

            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }

            const updatedAt = new Date(repo.updated_at);
            if (!lastUpdated || updatedAt > lastUpdated) {
                lastUpdated = updatedAt;
            }
        });

        // Sort languages by count
        const sortedLanguages = Object.entries(languages)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Calculate Activity Level
        const now = new Date();
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

        // Developer Score Calculation
        // Score = (repos * 2) + (totalStars * 3) + (followers * 2) + activityBonus
        const developerScore = (user.public_repos * 2) + (totalStars * 3) + (user.followers * 2) + activityBonus;

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
            },
            stats: {
                totalStars,
                totalRepos: user.public_repos,
                developerScore,
                activityLevel,
                languages: sortedLanguages.slice(0, 5), // Top 5
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
