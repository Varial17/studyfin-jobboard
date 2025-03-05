
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut } from "lucide-react";

export const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
          {user ? (
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
