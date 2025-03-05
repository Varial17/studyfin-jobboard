
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Debug logging to help trace authentication issues
  useEffect(() => {
    console.log("Navbar auth state:", { user: user?.email || "none", authLoading });
  }, [user, authLoading]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log("Logging out user");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during logout:", error);
        throw error;
      }
      
      console.log("Logout successful, navigating to home");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/">
          <img 
            src="/lovable-uploads/b6036afc-422e-4dc6-bdc2-936db28c6bc2.png" 
            alt="StudyFin Logo" 
            className="h-8"
          />
        </Link>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLanguage(language === "en" ? "zh" : "en")}
            className="flex items-center gap-2"
          >
            {t("language")}: {language === "zh" ? "CN" : "EN"}
          </Button>
          {authLoading ? (
            <div className="h-10 w-20 bg-gray-100 animate-pulse rounded-md"></div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {t("profile")}
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? "..." : t("logout")}
              </Button>
            </div>
          ) : (
            <Button onClick={() => navigate("/auth")} className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("login")}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
