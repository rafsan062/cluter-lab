import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full mb-2 hidden w-max px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 group-hover:block transition-opacity z-10 whitespace-nowrap">
        {content}
      </div>
    </div>
  );
};
