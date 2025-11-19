import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path: string;
}

export default function Breadcrumbs() {
  const location = useLocation();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", path: "/" }];

    const pathMap: { [key: string]: string } = {
      dashboard: "Dashboard",
      subjects: "Courses",
      enroll: "Enroll",
      upload: "Upload",
      "create-quiz": "Create Quiz",
      quizzes: "Quizzes",
      progress: "Progress",
      "past-exams": "Past Exams",
      "book-library": "Library",
      "student-dashboard": "Student Dashboard",
      "teacher-dashboard": "Teacher Dashboard",
      "student-performance": "Performance",
    };

    paths.forEach((path, index) => {
      const label = pathMap[path] || path.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const fullPath = "/" + paths.slice(0, index + 1).join("/");
      breadcrumbs.push({ label, path: fullPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <div className="bg-muted/50 border-b">
      <div className="container mx-auto px-4 py-2">
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              {index === 0 ? (
                <Link
                  to={crumb.path}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">{crumb.label}</span>
                </Link>
              ) : index === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-medium">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
