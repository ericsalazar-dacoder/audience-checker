"use client";

import React from "react";
import { useTheme } from "../../providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

// Standalone theme toggle for use in different layouts
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-blue-400" />
      ) : (
        <Moon className="h-4 w-4 text-blue-600" />
      )}
    </Button>
  );
};

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Audience Checker",
  subtitle = "Validate your SQL queries against business rules",
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-50 to-blue-25 dark:from-blue-950 dark:to-blue-900/50 p-6 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-blue-900 dark:text-blue-50">
            {title}
          </h1>
          <p className="text-blue-600 dark:text-blue-300">{subtitle}</p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};
