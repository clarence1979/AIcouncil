import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/Toast';
import { fetchRemoteSecrets } from './utils/auto-login';
import App from './App.tsx';
import './index.css';

async function bootstrap() {
  await fetchRemoteSecrets();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ToastProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ToastProvider>
    </StrictMode>
  );
}

bootstrap();
