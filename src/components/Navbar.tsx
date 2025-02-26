
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";

export const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();

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
        </div>
      </div>
    </nav>
  );
};
