# JuniorHub

JuniorHub is a platform that connects junior developers with companies that need help with small projects. This helps juniors build their portfolios while companies get free assistance.

## Tech Stack

- **Backend:** Node.js (TypeScript, Express, MongoDB)
- **Frontend:** React (TypeScript, Vite)
- **Monorepo:** Nx
- **Database:** MongoDB (with Mongoose)
- **Authentication:** JWT (with Refresh Tokens) & OAuth (Google, Facebook)
- **State Management:** React Query and Zustand
- **API Documentation:** Swagger
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

### Setting up OAuth

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

4. Start MongoDB using Docker:

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
npx nx test frontend
```

## Core Features

- User authentication (register/login with JWT & OAuth)
- Companies can post projects
- Juniors can apply for projects and submit work
- Like, comment, and save favorite projects
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
