
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=reset`,
        });
        
        console.log("Password reset attempt for:", email);
        if (error) {
          console.error("Password reset error:", error);
          throw error;
        }

        toast({
          title: t("checkEmail"),
          description: t("passwordResetSent"),
        });
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (error) throw error;

        // Check if user has completed their profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, title")
          .eq("id", user?.id)
          .single();

        navigate("/profile");
        
        // Show prompt if profile is incomplete
        if (!profile?.full_name || !profile?.title) {
          toast({
            title: t("welcomeToStudyFin"),
            description: t("pleaseCompleteProfile"),
            duration: 6000,
          });
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) throw error;

        toast({
          title: t("signupSuccess"),
          description: t("verifyEmail"),
        });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            {isForgotPassword 
              ? t("forgotPassword") 
              : isLogin ? t("login") : t("signup")}
          </h2>
          <p className="mt-2 text-gray-600">
            {isForgotPassword 
              ? t("forgotPasswordDesc") 
              : isLogin ? t("loginDescription") : t("signupDescription")}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {!isForgotPassword && (
            <div>
              <Input
                type="password"
                placeholder={t("password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading 
              ? t("loading") 
              : isForgotPassword 
                ? t("sendResetLink")
                : isLogin ? t("login") : t("signup")}
          </Button>
        </form>

        <div className="text-center space-y-2">
          {isLogin && !isForgotPassword && (
            <Button
              variant="link"
              onClick={() => setIsForgotPassword(true)}
              className="text-primary"
            >
              {t("forgotPasswordLink")}
            </Button>
          )}
          {isForgotPassword && (
            <Button
              variant="link"
              onClick={() => setIsForgotPassword(false)}
              className="text-primary"
            >
              {t("backToLogin")}
            </Button>
          )}
          <Button
            variant="link"
            onClick={() => {
              setIsLogin(!isLogin);
              setIsForgotPassword(false);
            }}
            className="text-primary block w-full"
          >
            {isLogin ? t("needAccount") : t("alreadyHaveAccount")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
