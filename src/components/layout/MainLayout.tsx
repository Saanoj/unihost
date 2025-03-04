import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Link as LinkIcon } from 'lucide-react';
import { useAppStore } from '../../store';

type MainLayoutProps = {
  children: React.ReactNode;
  showSidebar?: boolean;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, showSidebar = true }) => {
  const { isHost, switchUserType } = useAppStore();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MessageSquare size={24} />
          <h1 className="text-xl font-bold">UniHost Messages</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={switchUserType}
            className="flex items-center space-x-1 text-white hover:text-indigo-200 transition-colors"
          >
            <LinkIcon size={18} />
            <span>{isHost ? 'Switch to Traveler View' : 'Back to Main App'}</span>
          </button>
          <button className="bg-indigo-700 hover:bg-indigo-600 p-2 rounded-full">
            <span className="sr-only">Add conversation</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;