import { ReactNode } from "react";
import Navigation from "./Navigation";
import Breadcrumbs from "./Breadcrumbs";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <Breadcrumbs />
        <main>{children}</main>
      </div>
    </div>
  );
}
