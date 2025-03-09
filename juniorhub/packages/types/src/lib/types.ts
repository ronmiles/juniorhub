export function types(): string {
  return 'types';
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'junior' | 'company' | 'admin';
  profilePicture?: string;
  bio?: string;
  skills?: string[];
  projects?: string[]; // References to projects (IDs)
  applications?: string[]; // References to applications (IDs)
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  company: string; // Reference to company user (ID)
  requirements: string[];
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  status: 'open' | 'in-progress' | 'completed' | 'canceled';
  skillsRequired: string[];
  applicants?: string[]; // References to users who applied (IDs)
  selectedDeveloper?: string; // Reference to selected user (ID)
  tags: string[];
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  project: string; // Reference to project (ID)
  applicant: string; // Reference to user (ID)
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  submissionLink?: string; // Link to GitHub repo or other work
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  project: string; // Reference to project (ID)
  author: string; // Reference to user (ID)
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  recipient: string; // Reference to user (ID)
  type: 'application' | 'selection' | 'message' | 'project_update';
  content: string;
  read: boolean;
  relatedId: string; // ID of the related entity (project, application, etc.)
  createdAt: Date;
}

export interface Message {
  id: string;
  conversation: string; // Reference to conversation (ID)
  sender: string; // Reference to user (ID)
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[]; // References to users (IDs)
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'junior' | 'company';
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  requirements: string[];
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  skillsRequired: string[];
  tags: string[];
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  requirements?: string[];
  timeframe?: {
    startDate: Date;
    endDate: Date;
  };
  status?: 'open' | 'in-progress' | 'completed' | 'canceled';
  skillsRequired?: string[];
  tags?: string[];
}

export interface CreateApplicationRequest {
  project: string;
  coverLetter: string;
  submissionLink?: string;
}

export interface UpdateApplicationRequest {
  status?: 'pending' | 'accepted' | 'rejected';
  feedback?: string;
}
