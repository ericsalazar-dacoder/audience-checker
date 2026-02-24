"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, X, FolderKanban, Wrench, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    title: "Audience Generator",
    href: "/query-generator",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 shadow-xl transition-all duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
        {/* Header with Logo and Close Button */}
        <div className="flex items-center justify-between mb-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-300 rounded-lg flex items-center justify-center shadow-md">
              <Wrench className="h-4 w-4 text-blue-900" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-200 via-blue-100 to-blue-300 bg-clip-text text-transparent">
                UM
              </span>
              <span className="text-xl font-light tracking-tight text-blue-100">
                Tools
              </span>
            </div>
          </div>
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-blue-300 hover:bg-blue-700/50 hover:text-blue-50 -mr-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-900 text-blue-200 shadow-lg shadow-blue-900/50"
                    : "text-blue-100 hover:bg-blue-700/50 hover:text-blue-50"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <p className="px-2 text-xs text-blue-300">© 2026 UM Checker</p>
        </div>
      </div>
    </aside>
  );
};
