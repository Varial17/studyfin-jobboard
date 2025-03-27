
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="https://studyfin.com.au/" target="_blank" rel="noopener noreferrer">
          <img 
            src="/lovable-uploads/b6036afc-422e-4dc6-bdc2-936db28c6bc2.png" 
            alt="StudyFin Logo" 
            className="h-8"
          />
        </a>
        <div className="flex items-center gap-2 md:gap-4">
          {!isMobile && (
            <Button
              variant="outline"
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="flex items-center gap-2"
            >
              {t("language")}: {language === "zh" ? "CN" : "EN"}
            </Button>
          )}
          {isMobile && !user && (
            <Button size="sm" onClick={() => navigate("/auth")} className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {t("login")}
            </Button>
          )}
          {isMobile && user && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/profile")}
                className="flex items-center gap-1 px-2"
              >
                <User className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-1 px-2"
              >
                <LogOut className="w-3 h-3" />
              </Button>
            </div>
          )}
          {!isMobile && user && (
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
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t("logout")}
              </Button>
            </div>
          )}
          {!isMobile && !user && (
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
