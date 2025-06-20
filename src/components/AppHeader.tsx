"use client";

import { ArrowLeft, LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react';
import React from 'react';

interface AppHeaderProps {
  userName: string | null;
  isAdmin: boolean;
  onLogoutClick: () => void;
  pageTitle?: string;
  onPanelClick?: () => void;
  showPanelButton?: boolean;
  pageIcon?: React.ComponentType;
  showBackButton?: boolean;
  onBackClick?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onToggleDarkMode, isDarkMode, userName, isAdmin, onLogoutClick, onPanelClick, showPanelButton = true, showBackButton = false, onBackClick, pageTitle, pageIcon }) => {
  if (!userName) {
    return null;
  }

  const firstName = userName?.split(' ')[0];

  return (
    <header className="w-full sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-5xl mx-auto flex justify-between items-center p-4">
        <div className="flex items-center min-w-0">
          <div className="w-10 h-10 flex items-center justify-center mr-2">
            {showBackButton && (
              <button
                aria-label="Atrás"
                onClick={onBackClick}
                disabled={!onBackClick}
                className={`p-2 rounded-full transition-all duration-150 ease-in-out active:scale-90 active:bg-gray-300 dark:active:bg-gray-600
                            ${!onBackClick
                    ? 'text-gray-300 dark:text-gray-500 cursor-not-allowed'
                    : 'text-gray-500 hover:text-secondary-blue dark:text-gray-400 dark:hover:text-sky-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <ArrowLeft size={20} />
              </button>
            )}
          </div>
          <div className="flex items-baseline min-w-0">
            {pageTitle ? (
              <h1 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-200 truncate flex items-center">
                {pageIcon && <span className="mr-2">{React.createElement(pageIcon, { size: 24 } as any)}</span>}
                {pageTitle}
              </h1>
            ) : (
              <>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-nowrap">Hola,&nbsp;</span>
                <span className="text-sm sm:text-base font-bold text-secondary-blue dark:text-sky-400 truncate" title={firstName || ''}>{firstName}</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-nowrap">!</span>
                {isAdmin && (<span className="ml-2 text-xs bg-accent-yellow text-gray-700 px-1.5 py-0.5 rounded-full align-middle whitespace-nowrap flex-shrink-0">ADMIN</span>)}
              </>

            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {typeof isDarkMode !== 'undefined' && onToggleDarkMode && (
            <button
              aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
              onClick={onToggleDarkMode}
              className="p-2 text-gray-500 hover:text-secondary-blue dark:text-gray-400 dark:hover:text-sky-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 ease-in-out active:scale-90 active:bg-gray-300 dark:active:bg-gray-600"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}

          {showPanelButton && onPanelClick && (
            <button
              aria-label="Panel de Control"
              onClick={onPanelClick}
              className="p-2 text-gray-500 hover:text-secondary-blue dark:text-gray-400 dark:hover:text-sky-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 ease-in-out active:scale-90 active:bg-gray-300 dark:active:bg-gray-600"
            >
              <LayoutDashboard size={20} />
            </button>
          )}
          <button
            aria-label="Salir"
            onClick={onLogoutClick}
            className="p-2 text-gray-500 hover:text-secondary-blue dark:text-gray-400 dark:hover:text-sky-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 ease-in-out active:scale-90 active:bg-gray-300 dark:active:bg-gray-600"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;