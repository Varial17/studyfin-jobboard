
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
        <div className="text-2xl font-bold text-primary">StudyFin</div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLanguage(language === "en" ? "zh" : "en")}
            className="flex items-center gap-2"
          >
            {t("language")}: {language.toUpperCase()}
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
