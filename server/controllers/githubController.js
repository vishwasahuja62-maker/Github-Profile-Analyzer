const githubService = require('../services/githubService');

const getUserProfile = async (req, res) => {
    const { username } = req.params;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const data = await githubService.fetchUserData(username);
        res.json(data);
    } catch (error) {
        console.error('GitHub API Error:', error.message);
        const status = error.message === 'User not found' ? 404 : 500;
        res.status(status).json({ error: error.message });
    }
};

module.exports = {
    getUserProfile,
};
