
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
        <User className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "My Jobs",
      href: "/profile/jobs",
      icon: (
        <Briefcase className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Post Job",
      href: "/profile/post-job",
      icon: (
        <Plus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "/profile/settings",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
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
          <Link to="/" className="font-normal flex space-x-2 items-center text-sm text-black py-1">
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span className="font-medium text-black dark:text-white whitespace-pre">
              Job Board
            </motion.span>
          </Link>
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
            <button 
              onClick={handleLogout}
              className="flex items-center justify-start gap-2 group/sidebar py-2 w-full"
            >
              <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
              <span className="text-neutral-700 dark:text-neutral-200 text-sm">
                Logout
              </span>
            </button>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
