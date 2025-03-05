
import { useAuth } from "@/contexts/AuthContext";
import { User, Briefcase, Plus, Settings, LogOut, ClipboardList } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProfileSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  
  const links = [
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      label: "My Jobs",
      href: "/jobs",
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      label: "Applications",
      href: "/profile/applications",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      label: "Post Job",
      href: "/profile/post-job",
      icon: <Plus className="h-5 w-5" />,
    },
    {
      label: "Settings",
      href: "/profile",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-white dark:bg-neutral-800 shadow-md h-screen sticky top-0 overflow-y-auto hidden md:block">
      <div className="py-6">
        <nav className="px-3 space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.href;
            
            return (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive
                    ? "bg-gray-100 text-primary dark:bg-neutral-700"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-700"
                )}
              >
                <div className={cn(
                  "mr-3",
                  isActive 
                    ? "text-primary" 
                    : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500"
                )}>
                  {link.icon}
                </div>
                {link.label}
              </Link>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-700"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
            Logout
          </button>
        </nav>
      </div>
    </aside>
  );
}
