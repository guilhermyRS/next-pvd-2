'use client';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider } from '@/contexts/UserContext';
import { ToastContainer } from 'react-toastify';

export default function RootLayout({ children }) {
    return (
      <html lang="pt-BR">
        <body>
          <UserProvider>
            {children}
            <ToastContainer 
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </UserProvider>
        </body>
      </html>
    );
  }