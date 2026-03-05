# Aurora Social

A full-stack social media platform with real-time messaging, stories, analytics, AI-powered sentiment analysis, and more — built with React, TypeScript, Node.js, and PostgreSQL, deployed on AWS.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5.15-2D3748?logo=prisma)
![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20RDS%20%7C%20S3-FF9900?logo=amazonaws)

---

## Features

### Core Social
- **Posts** — Text, images, videos, GIFs with hashtag support
- **Reactions** — Emoji reactions beyond simple likes
- **Comments** — Threaded replies with likes
- **Polls** — Create polls attached to posts
- **Stories** — 24-hour expiring photo/video stories
- **Direct Messages** — Real-time chat with typing indicators
- **Follow System** — Follow/unfollow with follower counts
- **Friend Requests** — Send, accept, reject friend requests
- **Saved Posts** — Bookmark posts for later
- **Notifications** — Likes, comments, follows, messages, friend requests

### Profiles & Discovery
- **User Profiles** — Bio, profile picture, cover photo, birthday, location
- **Explore Feed** — Search posts by content or hashtag
- **Trending Hashtags** — Discover popular topics
- **User Suggestions** — Recommended users to follow

### Groups & Events
- **Groups** — Public/private communities with group posts
- **Events** — Create events with RSVP tracking

### Admin & Analytics
- **Analytics Dashboard** — Engagement metrics, user growth, retention cohorts, posting patterns
- **Sentiment Analysis** — AI-powered post sentiment classification (Claude/GPT)
- **Content Distribution** — Breakdown of post types (text, media, polls)
- **Top Creators** — Ranked by post and comment activity
- **PDF/Excel Export** — Download analytics reports

### Platform
- **Secure Auth** — JWT with HttpOnly cookies, access + refresh tokens
- **Email Password Reset** — 6-digit code via email with SHA-256 hashed tokens
- **File Uploads** — Images and videos via AWS S3
- **Synthetic Users** — AI-generated test users with realistic personas
- **AuroraBot** — Auto-follow and auto-reply bot
- **Scheduled Posts** — Queue posts for future publishing
- **Bug/Feature Reporting** — In-app support with email notifications

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + TypeScript | UI components |
| **Build** | Vite 7 | Dev server & bundling |
| **Styling** | Tailwind CSS 4 + CSS | Utility & custom styles |
| **Charts** | Recharts 3 | Analytics visualizations |
| **HTTP** | Axios | API requests |
| **Export** | jsPDF + SheetJS | PDF & Excel report generation |
| **Backend** | Express 5 | REST API server |
| **ORM** | Prisma 5 | Type-safe database queries |
| **Database** | PostgreSQL 16 (AWS RDS) | Production data storage |
| **Auth** | JWT + bcrypt | Authentication & password hashing |
| **Validation** | Zod 4 | Request schema validation |
| **Email** | Nodemailer | Password resets & notifications |
| **Storage** | AWS S3 | Image & video uploads |
| **AI** | Anthropic Claude + OpenAI GPT | Sentiment analysis & user generation |
| **Hosting** | AWS EC2 | Application server |
| **Proxy** | Nginx | Reverse proxy & static file serving |
| **Process** | PM2 | Node.js process management |
| **CI/CD** | GitHub Actions | Auto-deploy on push to main |

---

## Project Structure

```
Aurora socials/
├── src/                           # React frontend (TypeScript)
│   ├── App.tsx                    # Router (17 routes)
│   ├── api/axios.tsx              # Axios instance
│   ├── utils/
│   │   ├── exportAnalytics.ts     # PDF & Excel export
│   │   └── sanitize.ts            # XSS sanitization
│   └── assets/components/
│       ├── WelcomePage.tsx         # Landing page
│       ├── LandingPage.tsx        # Main feed
│       ├── Navbar.tsx             # Navigation bar
│       ├── PostCard.tsx           # Post component
│       ├── PostView.tsx           # Single post view
│       ├── Profile.tsx            # User profiles
│       ├── MessagesPanel.tsx      # DM slide-out panel
│       ├── NotificationsPanel.tsx # Notifications panel
│       ├── Stories.tsx            # Stories carousel
│       ├── Friends.tsx            # Friends management
│       ├── AdminDashboard.tsx     # Analytics dashboard
│       ├── Register.tsx           # Registration
│       ├── SignIn.tsx             # Login
│       ├── ForgotPassword.tsx     # Email-based password reset
│       ├── SavedPosts.tsx         # Bookmarked posts
│       ├── Support.tsx            # Bug/feature reports
│       └── UserGenerator.tsx      # Synthetic user creation
│
├── server/                        # Express backend
│   ├── index.js                   # Entry point & auth routes
│   ├── routes/                    # API route modules (19 files)
│   │   ├── posts.js               # Post CRUD & reactions
│   │   ├── comments.js            # Comments & replies
│   │   ├── users.js               # User profiles
│   │   ├── friends.js             # Friend requests
│   │   ├── follow.js              # Follow system
│   │   ├── messages.js            # Direct messaging
│   │   ├── savedPosts.js          # Bookmarks
│   │   ├── stories.js             # 24hr stories
│   │   ├── polls.js               # Post polls
│   │   ├── events.js              # Events & RSVP
│   │   ├── groups.js              # Communities
│   │   ├── notifications.js       # Notification system
│   │   ├── scheduledPosts.js      # Post scheduling
│   │   ├── reports.js             # Bug/feature reporting
│   │   ├── analytics.js           # Admin analytics
│   │   ├── admin.js               # Admin tools
│   │   └── news.js                # External news feed
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   ├── adminAuth.js           # Developer-only access
│   │   ├── validate.js            # Zod validation
│   │   └── upload.js              # S3/local file uploads
│   ├── services/
│   │   ├── email.js               # Nodemailer utility
│   │   ├── analytics/             # Analytics computation
│   │   ├── llm/                   # AI provider abstraction
│   │   ├── imageGen/              # DALL-E integration
│   │   └── syntheticUsers/        # Test user generation
│   ├── validation/schemas.js      # Zod schemas
│   └── prisma/schema.prisma       # Database schema (32 models)
│
├── .github/workflows/deploy.yml   # CI/CD auto-deploy
└── package.json
```

---

## Database Models

| Category | Models |
|----------|--------|
| **Users** | User (with developer flag, reset tokens) |
| **Content** | Post, Comment, Like, CommentLike, Reaction, SavedPost |
| **Social** | Friendship, Follow, Message |
| **Media** | Story, StoryView, Hashtag, PostHashtag |
| **Engagement** | Poll, PollOption, PollVote, Notification |
| **Communities** | Group, GroupMember, GroupPost, Event, EventRSVP |
| **Admin** | Report, ScheduledPost |
| **Analytics** | DailyEngagement, UserActivityMetric, HashtagTrend, PostSentiment |

---

## API Overview

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Auth** | 8 | Register, login, logout, token refresh, password reset (3-step) |
| **Posts** | 10 | CRUD, search, hashtags, reactions |
| **Comments** | 3 | Create, like, delete (with threading) |
| **Users** | 3 | Profiles, suggestions, updates |
| **Friends** | 5 | Request, accept, reject, list, status |
| **Follow** | 5 | Follow, unfollow, counts, lists |
| **Messages** | 7 | Send, conversations, unread, typing indicators |
| **Stories** | 5 | Create, feed, view tracking |
| **Polls** | 4 | Create, vote, results |
| **Events** | 6 | Create, RSVP, user events |
| **Groups** | 8 | Create, join, post, manage |
| **Notifications** | 5 | Fetch, mark read, cleanup |
| **Scheduled Posts** | 5 | Create, update, publish |
| **Reports** | 5 | Submit, track, moderate |
| **Analytics** | 10 | Overview, engagement, growth, sentiment, export |

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (or use SQLite for local dev)

### Installation

```bash
cd "Aurora socials"
npm install

cd server
npm install
npx prisma generate
npx prisma db push
```

### Environment Variables

Create `server/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/aurora_social"
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
ADMIN_API_KEY=your-admin-key

# Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Run

```bash
# Terminal 1: Backend
cd server && node index.js

# Terminal 2: Frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deployment

Deployed on AWS with auto-deploy via GitHub Actions on push to `main`.

| Service | Purpose |
|---------|---------|
| **EC2** | Application server (Node.js + Nginx) |
| **RDS** | PostgreSQL database |
| **S3** | Media file storage |
| **PM2** | Process management |
| **GitHub Actions** | CI/CD pipeline |

---

## Security

- JWT with HttpOnly cookies (access + refresh tokens)
- bcrypt password hashing (10 salt rounds)
- Rate limiting on auth endpoints
- Helmet.js HTTP security headers
- Zod schema validation on all inputs
- DOMPurify XSS prevention
- CORS configuration
- SHA-256 hashed password reset tokens with 15-minute expiry

---

Built with React, TypeScript, Node.js, Express, PostgreSQL, Prisma, and AWS.
