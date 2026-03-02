import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "OrgBlueprint MVP",
  description: "Conversational Salesforce recommender and blueprint generator",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
