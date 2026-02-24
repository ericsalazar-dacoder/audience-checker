"use client";

import React from "react";
import { ThemeProvider } from "../providers/theme-provider";
import { MainLayout } from "./layout/MainLayout";
import { Toaster } from "@/components/ui/toaster";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <MainLayout>{children}</MainLayout>
      <Toaster />
    </ThemeProvider>
  );
};
