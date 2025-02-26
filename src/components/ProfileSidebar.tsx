
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
        <User className="text-neutral-500 dark:text-neutral-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-primary transition-colors" />
      ),
    },
    {
      label: "My Jobs",
      href: "/profile/jobs",
      icon: (
        <Briefcase className="text-neutral-500 dark:text-neutral-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-primary transition-colors" />
      ),
    },
    {
      label: "Post Job",
      href: "/profile/post-job",
      icon: (
        <Plus className="text-neutral-500 dark:text-neutral-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-primary transition-colors" />
      ),
    },
    {
      label: "Settings",
      href: "/profile/settings",
      icon: (
        <Settings className="text-neutral-500 dark:text-neutral-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-primary transition-colors" />
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
          <Link to="/" className="flex items-center gap-3 px-4 py-2 mb-6">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <motion.span className="font-bold text-white text-lg">S</motion.span>
            </div>
            <motion.span className="font-semibold text-neutral-900 dark:text-white text-lg whitespace-pre">
              Studyfin
            </motion.span>
          </Link>
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
            <button 
              onClick={handleLogout}
              className="flex items-center justify-start gap-3 group/sidebar py-3 px-4 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 w-full text-left"
            >
              <LogOut className="text-neutral-500 dark:text-neutral-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-primary transition-colors" />
              <span className="text-neutral-700 dark:text-neutral-200 text-sm font-medium group-hover/sidebar:text-primary transition-colors">
                Logout
              </span>
            </button>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
