
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => {
  return (
    <div className={`bg-dark-card border border-dark-border rounded-lg shadow-md ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center">
          {title && <h2 className="text-lg font-bold text-dark-text">{title}</h2>}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
