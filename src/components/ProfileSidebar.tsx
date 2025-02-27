
import { useAuth } from "@/contexts/AuthContext";
import { User, Briefcase, Plus, Settings, LogOut, ClipboardList } from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function ProfileSidebar() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const links = [
    {
      label: "Profile",
      href: "/profile",
      icon: (
        <User className="h-5 w-5 flex-shrink-0 transition-colors text-neutral-400 group-hover/link:text-primary group-[.active]/link:text-primary dark:text-neutral-500 dark:group-hover/link:text-primary" />
      ),
    },
    {
      label: "My Jobs",
      href: "/jobs",
      icon: (
        <Briefcase className="h-5 w-5 flex-shrink-0 transition-colors text-neutral-400 group-hover/link:text-primary group-[.active]/link:text-primary dark:text-neutral-500 dark:group-hover/link:text-primary" />
      ),
    },
    {
      label: "Applications",
      href: "/profile/applications",
      icon: (
        <ClipboardList className="h-5 w-5 flex-shrink-0 transition-colors text-neutral-400 group-hover/link:text-primary group-[.active]/link:text-primary dark:text-neutral-500 dark:group-hover/link:text-primary" />
      ),
    },
    {
      label: "Post Job",
      href: "/profile/post-job",
      icon: (
        <Plus className="h-5 w-5 flex-shrink-0 transition-colors text-neutral-400 group-hover/link:text-primary group-[.active]/link:text-primary dark:text-neutral-500 dark:group-hover/link:text-primary" />
      ),
    },
    {
      label: "Settings",
      href: "/profile/settings",
      icon: (
        <Settings className="h-5 w-5 flex-shrink-0 transition-colors text-neutral-400 group-hover/link:text-primary group-[.active]/link:text-primary dark:text-neutral-500 dark:group-hover/link:text-primary" />
      ),
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <SidebarLink 
              key={link.label} 
              link={link}
              className="group/link"
              expanded={isExpanded}
            />
          ))}
          <button 
            onClick={handleLogout}
            className="flex items-center group/link py-3 px-4 rounded-lg hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-all duration-200 w-full"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 transition-colors text-neutral-400 group-hover/link:text-primary dark:text-neutral-500 dark:group-hover/link:text-primary" />
            <span className={`text-neutral-600 dark:text-neutral-300 text-sm font-medium ml-3 transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
              Logout
            </span>
          </button>
        </nav>
      </SidebarBody>
    </Sidebar>
  );
}
