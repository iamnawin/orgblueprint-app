import "./globals.css";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { AIAssistantWidget } from "@/components/AIAssistantWidget";

export const metadata = {
  title: "OrgBlueprint — Salesforce Blueprint Generator",
  description: "AI-powered Salesforce product recommender and implementation blueprint generator",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Navbar />
        <main className="min-h-screen bg-slate-950 py-8 px-4">
          {children}
        </main>
        <Toaster />
        <AIAssistantWidget />
      </body>
    </html>
  );
}
