# JuniorHub

JuniorHub is a platform that connects junior developers with companies that need help with small projects. This helps juniors build their portfolios while companies get free assistance.

## Tech Stack

- **Backend:** Node.js (TypeScript, Express, MongoDB)
- **Frontend:** React (TypeScript, Vite)
- **Monorepo:** Nx
- **Database:** MongoDB (with Mongoose)
- **Authentication:** JWT (with Refresh Tokens) & OAuth (Google)
- **State Management:** React Query and Zustand
- **API Documentation:** Swagger
- **AI Integration:** Groq API for AI-enhanced project creation
- **Testing:** Jest (unit tests for backend), React Testing Library (frontend)
- **Deployment:** Docker + PM2 (backend), Vercel/Render (frontend)
- **CI/CD:** GitHub Actions

## Project Structure

```
junior-hub/
│── apps/
│   ├── backend/  (Node.js Express server)
│   ├── frontend/ (React app)
│── packages/
│   ├── shared-ui/  (Reusable UI components)
│   ├── types/  (Shared TypeScript types)
│── .github/  (CI/CD workflows)
│── docker-compose.yml
│── nx.json
│── package.json
│── tsconfig.json
│── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Docker and Docker Compose (for running MongoDB)
- Groq API key (for AI-enhanced project creation)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/juniorhub.git
cd juniorhub
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration.

### Setting up OAuth and API Keys

1. For Google authentication:

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add authorized JavaScript origins (e.g., `http://localhost:4200`)
   - Add authorized redirect URIs (e.g., `http://localhost:3000/api/auth/google/callback`)
   - Copy the Client ID and Client Secret
   - Add these values to both `.env` files:
     - Root `.env`: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
     - Frontend `.env`: `VITE_GOOGLE_CLIENT_ID` (same as the Client ID above)

2. For AI-enhanced project creation:

   - Sign up for a Groq API account at [https://console.groq.com/](https://console.groq.com/)
   - Generate an API key from your account dashboard
   - Add the API key to your `.env` file as `GROQ_API_KEY`

3. Start MongoDB using Docker:

```bash
docker-compose up -d mongodb mongo-express
```

MongoDB will be available at `mongodb://localhost:27017` and MongoDB Express (admin interface) at `http://localhost:8081`.

### Development

1. Start the backend development server:

```bash
npx nx serve backend
```

The backend will be available at `http://localhost:3000`.

2. Start the frontend development server:

```bash
npx nx serve frontend
```

The frontend will be available at `http://localhost:4200`.

3. API Documentation:

Once the backend is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api-docs
```

### Building for Production

1. Build the backend:

```bash
npx nx build backend
```

2. Build the frontend:

```bash
npx nx build frontend
```

### Testing

1. Run backend tests:

```bash
npx nx test backend
```

2. Run frontend tests:

```bash
npx test frontend
```

## Core Features

- User authentication (register/login with JWT & OAuth)
- Companies can post projects
- Juniors can apply for projects and submit work
- Like, comment, and save favorite projects
- AI-enhanced project creation (automatically generates descriptions, tags, and required skills)
- AI recommendations for projects
- Notifications for project status updates
- Chat system for real-time communication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# AI-Enhanced Project Creation

The "Enhance with AI" feature allows companies to improve project descriptions, generate relevant tags, and suggest required skills with a single click.

## Setup

1. Get a Groq API key from [https://console.groq.com/](https://console.groq.com/)
2. Add the API key to your `.env` file:

```
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=deepseek-r1-distill-llama-70b  # Or another suitable Groq model
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=2000
```

## Troubleshooting

If you encounter issues with the "Enhance with AI" feature:

1. **Check browser console for errors** - Open your browser developer tools to see detailed error logs.

2. **Verify API key** - Make sure your Groq API key is correctly set in the `.env` file.

3. **Authentication issues** - If you see authentication errors:

   - Ensure you're logged in as a company user
   - Check if your session token is valid
   - Try logging out and back in

4. **Handling <think> sections** - Some LLM responses may include `<think>` sections that need to be cleaned up. The application handles this automatically.

5. **Testing the API connection directly** - You can test the Groq API connection by running:
   ```bash
   cd apps/backend
   npx ts-node --esm src/utils/test-groq.ts "Test title" "Test description"
   ```

## How It Works

1. When a company user clicks "Enhance with AI", the application sends the project title and description to the backend.
2. The backend calls the Groq API, which returns an enhanced description, tags, required skills, project requirements, and a suggested experience level.
3. The frontend automatically populates the form fields with this enhanced data.
4. The company can review and edit the AI-enhanced content before submitting the project.
