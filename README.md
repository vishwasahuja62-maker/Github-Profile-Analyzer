# GitHub Profile Analyzer

A modern, full-stack dashboard that analyzes GitHub profiles and displays development activity, skills, and performance.

## Features

- **Profile Overview**: View avatar, bio, location, and social stats.
- **Developer Score**: A custom metric calculated based on repositories, stars, followers, and recent activity.
- **Language Distribution**: Pie chart showing the user's most used languages.
- **Top Repositories**: Bar chart showcasing the most starred projects.
- **Activity Indicator**: Badges indicating High, Medium, or Low activity based on recent updates.
- **Responsive Design**: Premium UI that works on desktop and mobile.

## Tech Stack

- **Frontend**: React (Vite), Chart.js, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, Axios.
- **API**: GitHub REST API.

## Getting Started

### Prerequisites

- Node.js installed on your machine.
- (Optional) A GitHub Personal Access Token for higher rate limits.

### Installation

1. Clone the repository.
2. Install dependencies for both parts:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Configuration

Create a `.env` file in the `server` directory:

```env
PORT=5000
GITHUB_TOKEN=your_github_token_here (optional)
```

### Running Locally

You'll need two terminals open:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Deployment

### Backend (Render/Heroku/Railway)
- Set the build command to `npm install`.
- Set the start command to `node index.js`.
- Add your environment variables (PORT, GITHUB_TOKEN).

### Frontend (Vercel/Netlify)
- Set the build command to `npm run build`.
- Set the output directory to `dist`.
- Set the environment variable `VITE_API_BASE_URL` to your deployed backend URL (e.g., `https://api.yourdomain.com/api`).
