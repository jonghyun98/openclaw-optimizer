import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 app-drag">
      <h1 className="text-sm font-semibold text-gray-200">{title}</h1>
    </header>
  );
};
