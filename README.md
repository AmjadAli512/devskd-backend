## 🚀 Setup

1. **Clone and install:**
   \`\`\`bash
   git clone <repo-url>
   cd week4-notes-api
   npm install
   \`\`\`

2. **Create `.env` file** (copy from `.env.example`):
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Then fill in:
   - `MONGODB_URI` – your MongoDB Atlas connection string
   - `JWT_SECRET` – generate with:
     \`\`\`bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     \`\`\`

3. **Run the server:**
   \`\`\`bash
   npm run dev     # with nodemon (development)
   # or
   npm start       # plain node
   \`\`\`

Server runs at `http://localhost:3000`.

## 🔐 Authentication Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/signup` | Public | Register a new user |
| POST | `/auth/login` | Public | Authenticate and get JWT |
| GET | `/notes` | 🔒 Protected | Get all notes (own only) |
| GET | `/notes/:id` | 🔒 Protected | Get one note |
| POST | `/notes` | 🔒 Protected | Create a note |
| PUT | `/notes/:id` | 🔒 Protected | Update a note |
| DELETE | `/notes/:id` | 🔒 Protected | Delete a note |

Protected routes require header:
\`\`\`
Authorization: Bearer <JWT>
\`\`\`