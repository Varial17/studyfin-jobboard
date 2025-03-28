
"use client";

import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion, HTMLMotionProps } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

interface SidebarBodyProps extends HTMLMotionProps<"div"> {
  children?: React.ReactNode;
}

export const SidebarBody = ({ children, ...props }: SidebarBodyProps) => {
  return (
    <>
      <DesktopSidebar {...props}>{children}</DesktopSidebar>
      <MobileSidebar {...props}>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className={cn(
        "h-full px-2 py-6 hidden md:flex md:flex-col bg-white dark:bg-neutral-900/95 w-[60px] hover:w-[180px] group flex-shrink-0 shadow-xl shadow-neutral-200/50 dark:shadow-neutral-950/50 border-r border-neutral-100 dark:border-neutral-800/50 backdrop-blur-sm transition-all duration-300",
        className
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface MobileSidebarProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  className?: string;
}

export const MobileSidebar = ({
  className,
  children,
  ...props
}: MobileSidebarProps) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div className="h-16 px-4 flex flex-row md:hidden items-center justify-between bg-white dark:bg-neutral-900 w-full border-b border-neutral-100 dark:border-neutral-800/50 backdrop-blur-sm">
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-neutral-600 dark:text-neutral-300 cursor-pointer hover:text-primary transition-colors"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900/95 p-10 z-[100] flex flex-col justify-between shadow-2xl backdrop-blur-sm",
                className
              )}
              {...props}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-600 dark:text-neutral-300 cursor-pointer hover:text-primary transition-colors"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const isActive = window.location.pathname === link.href;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center py-3 px-4 rounded-lg hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-all duration-200 group/link relative overflow-hidden",
        isActive && "bg-neutral-100/80 dark:bg-neutral-800/80 active",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {link.icon}
      <motion.span
        initial={{ opacity: 0, width: 0 }}
        animate={{ 
          opacity: isHovered || document.querySelector(".group:hover") ? 1 : 0,
          width: isHovered || document.querySelector(".group:hover") ? "auto" : 0
        }}
        transition={{ duration: 0.2 }}
        className="text-neutral-600 dark:text-neutral-300 text-sm font-medium ml-3 whitespace-nowrap overflow-hidden"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
