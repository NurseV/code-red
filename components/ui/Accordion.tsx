
import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon } from '../icons/Icons';

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-dark-border rounded-lg bg-dark-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-dark-border/30 hover:bg-dark-border/50 focus:outline-none"
      >
        <h3 className="text-lg font-semibold text-dark-text">{title}</h3>
        <ChevronDownIcon
          className={`h-6 w-6 text-dark-text-secondary transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px]' : 'max-h-0'
        }`}
      >
        <div className="p-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
