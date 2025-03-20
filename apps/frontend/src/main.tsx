import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { AuthProvider } from './app/hooks/useAuth';
import './styles.css'; // Import global styles

import App from './app/app';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
