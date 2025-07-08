
import React, { useState } from 'react';

interface TabsProps {
  tabs: { label: string; content: React.ReactNode }[];
}

const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="border-b border-dark-border">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(index)}
              className={`${
                index === activeTab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-dark-text-secondary hover:text-dark-text hover:border-gray-500'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tabs;
