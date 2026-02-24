import "./globals.css";
import { ClientLayout } from "./components/ClientLayout";

export const metadata = {
  title: "UM Checker - Query & Business Rule Alignment",
  description: "Validate SQL queries against defined business rules",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
