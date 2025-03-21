// Uncomment this line to use CSS modules
import styles from "./app.module.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import pages (we'll create these later)
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProjectList from "./pages/ProjectList";
import ProjectDetail from "./pages/ProjectDetail";
import CreateProject from "./pages/CreateProject";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/OAuthCallback";
import CompleteRegistration from "./pages/CompleteRegistration";
import ProjectApplications from "./pages/ProjectApplications";
import ApplicationDetail from "./pages/ApplicationDetail";
import EditProject from "./pages/EditProject";

// Import components (we'll create these later)
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Create a client for React Query
const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route
              path="register/complete"
              element={<CompleteRegistration />}
            />
            <Route path="oauth-callback" element={<OAuthCallback />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/new" element={<CreateProject />} />
            <Route path="projects/:id/edit" element={<EditProject />} />

            {/* Protected routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="projects/:id/applications"
              element={
                <ProtectedRoute roles={["company"]}>
                  <ProjectApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="applications/:id"
              element={
                <ProtectedRoute>
                  <ApplicationDetail />
                </ProtectedRoute>
              }
            />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
