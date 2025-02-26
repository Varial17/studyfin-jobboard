
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, User, Briefcase, Plus, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

export function ProfileSidebar() {
  const { user } = useAuth();
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
      href: "/profile/jobs",
      icon: (
        <Briefcase className="h-5 w-5 flex-shrink-0 transition-colors text-neutral-400 group-hover/link:text-primary group-[.active]/link:text-primary dark:text-neutral-500 dark:group-hover/link:text-primary" />
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
        <div className="flex flex-col flex-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-2 mb-8 group/logo">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-200 group-hover/logo:scale-105">
              <motion.span className="font-bold text-white text-xl">S</motion.span>
            </div>
            <motion.span className="font-semibold text-neutral-800 dark:text-white text-lg tracking-tight">
              Studyfin
            </motion.span>
          </Link>
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <SidebarLink 
                key={link.label} 
                link={link}
                className="group/link relative overflow-hidden"
              />
            ))}
            <button 
              onClick={handleLogout}
              className="flex items-center justify-start gap-3 group/link py-3 px-4 rounded-lg hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-all duration-200 w-full text-left relative overflow-hidden"
            >
              <LogOut className="h-5 w-5 flex-shrink-0 transition-colors text-neutral-400 group-hover/link:text-primary dark:text-neutral-500 dark:group-hover/link:text-primary" />
              <span className="text-neutral-600 dark:text-neutral-300 text-sm font-medium group-hover/link:text-primary transition-colors">
                Logout
              </span>
            </button>
          </nav>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
