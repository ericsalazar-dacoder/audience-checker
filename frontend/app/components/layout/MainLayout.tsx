"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./Header";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Overlay for closing sidebar when clicking outside */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[35] bg-black/50 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="transition-all duration-300 mx-auto">
        {/* Top bar with theme toggle - modern gradient */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-gradient-to-r from-blue-50 via-white to-blue-25 dark:from-blue-950/50 dark:via-gray-900 dark:to-blue-900/50 px-6 shadow-sm">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1"></div>
          <ThemeToggle />
        </header>
        {/* Main content */}
        <main className="p-6 max-w-4xl mx-auto">{children}</main>
      </div>
    </div>
  );
};
