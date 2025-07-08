import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-dark-text">
      <PublicNavbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="bg-dark-card border-t border-dark-border">
         <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-dark-text-secondary text-sm">
            <span>&copy; {new Date().getFullYear()} Anytown Fire Department. All Rights Reserved.</span>
            <span className="mx-2">|</span>
            <Link to="/app/login" className="hover:text-dark-text hover:underline">Staff Login</Link>
         </div>
      </footer>
    </div>
  );
};

export default PublicLayout;