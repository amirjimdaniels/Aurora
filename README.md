# 🌌 Aurora Socials

A modern, Facebook-style social media platform built with React and Node.js.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-25.3.0-339933?logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-5.2.1-000000?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite)

## ✨ Features

- **📝 Posts** - Create posts with text and image uploads
- **❤️ Likes** - Like posts and comments
- **💬 Comments** - Threaded comments with reply support
- **👥 Follow System** - Follow/unfollow users
- **💌 Direct Messages** - Chat with friends (mutual followers)
- **🔖 Saved Posts** - Bookmark posts to view later
- **👤 Profiles** - Customizable profiles with cover photos, bios, and more
- **🔗 Share** - Copy post links to share

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd "Aurora socials"
   npm install
   ```

2. **Set up the database:**
   ```bash
   cd server
   npm install
   npx prisma generate
   npx prisma migrate dev
   ```

3. **Start the backend server:**
   ```bash
   # In the server folder
   node index.js
   ```
   Server runs on `http://localhost:5000`

4. **Start the frontend (new terminal):**
   ```bash
   # In the Aurora socials folder
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

5. **Open your browser** to `http://localhost:5173` and register an account!

## 📁 Project Structure

```
Aurora socials/
├── src/                      # React frontend
│   ├── App.tsx               # Main router
│   └── assets/components/    # React components
│       ├── Navbar.jsx        # Navigation bar
│       ├── LandingPage.jsx   # Main feed
│       ├── Profile.jsx       # User profiles
│       ├── PostCard.jsx      # Reusable post component
│       ├── SavedPosts.jsx    # Bookmarked posts
│       ├── MessagesPanel.jsx # DM slide-out
│       └── ...
│
├── server/                   # Express backend
│   ├── index.js              # Server entry point
│   ├── routes/               # API endpoints
│   │   ├── posts.js          # Post CRUD
│   │   ├── comments.js       # Comments & replies
│   │   ├── users.js          # User profiles
│   │   ├── follow.js         # Follow system
│   │   ├── messages.js       # Direct messages
│   │   └── savedPosts.js     # Saved posts
│   └── prisma/
│       └── schema.prisma     # Database schema
│
└── package.json
```

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + Vite | UI & build tooling |
| **Routing** | React Router 6 | Client-side navigation |
| **Styling** | Tailwind CSS + CSS | Utility & custom styles |
| **HTTP** | Axios | API requests |
| **Backend** | Express 5 | REST API server |
| **ORM** | Prisma | Database queries |
| **Database** | SQLite | Data storage |

## 📡 API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/register` | Create account |
| `POST /api/login` | Sign in |
| `GET /api/posts` | Get feed |
| `POST /api/posts` | Create post |
| `POST /api/posts/:id/like` | Toggle like |
| `POST /api/comments/:id/comment` | Add comment |
| `POST /api/follow/follow` | Follow user |
| `POST /api/messages/send` | Send DM |
| `GET /api/users/:id` | Get profile |

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete API documentation.

## 🗄 Database Models

- **User** - Accounts & profiles
- **Post** - User content
- **Comment** - Post comments (with threading)
- **Like** - Post likes
- **CommentLike** - Comment likes
- **Follow** - User relationships
- **Message** - Direct messages
- **SavedPost** - Bookmarks

## 📜 Scripts

```bash
# Frontend
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build

# Backend
node server/index.js  # Start server

# Database
npx prisma studio     # Visual database editor
npx prisma migrate dev # Run migrations
npx prisma generate   # Generate client
```

## 🔧 Configuration

- **Frontend port**: `5173` (Vite default)
- **Backend port**: `5000`
- **Database**: `server/prisma/dev.db`
- **Max upload size**: `50MB` (for base64 images)

## 📖 Documentation

For detailed architecture, data flow diagrams, and UML:
→ **[ARCHITECTURE.md](ARCHITECTURE.md)**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is for educational purposes.

---

<p align="center">
  Built with ❤️ using React & Node.js
</p>

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
<img width="988" height="893" alt="PlantuML" src="https://github.com/user-attachments/assets/b5589b3f-fc1e-42ef-81c4-d43354b60bee" />

<img width="1873" height="732" alt="Backend uml" src="https://github.com/user-attachments/assets/e5f5c8cd-91cb-4419-903b-579f41154018" />




