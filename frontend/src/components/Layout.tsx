import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  } | null;
}

export const Layout = ({ children, isAuthenticated, user }: LayoutProps) => {
  const location = useLocation();
  const showFooter = location.pathname === '/';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar isAuthenticated={isAuthenticated} user={user} />
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}; 