import React from 'react';

type LoadingScreenProps = {
  message?: string;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-700 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingScreen;