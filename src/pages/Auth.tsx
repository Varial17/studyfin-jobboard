import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
  }, [user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.hash.substring(1));
    const searchParams = new URLSearchParams(location.search);
    const isResetMode = searchParams.get('type') === 'reset';
    
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    const accessToken = params.get('access_token');
    const tokenType = params.get('type');
    
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const emailFromUrl = searchParams.get('email');

    console.log("URL Debug:", {
      hash: location.hash,
      hash_params: {
        accessToken,
        tokenType,
        error,
        errorDescription
      },
      search: location.search,
      search_params: {
        token,
        type,
        emailFromUrl,
        isResetMode
      }
    });

    if (error) {
      let errorMsg = errorDescription;
      if (error === "access_denied" || errorDescription?.includes("invalid")) {
        errorMsg = "The password reset link is invalid or has expired. Please request a new one.";
      }
      
      toast({
        variant: "destructive",
        title: t("error"),
        description: errorMsg,
        duration: 6000,
      });
      setIsLogin(true);
      setIsForgotPassword(false);
      setIsResettingPassword(false);
      return;
    }

    if (accessToken && tokenType === 'recovery') {
      console.log("Found access_token in hash with recovery type");
      setIsResettingPassword(true);
      setIsForgotPassword(false);
      setIsLogin(false);
      return;
    }
    
    if (token && type === 'recovery' && emailFromUrl) {
      const verifyToken = async () => {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token,
            type: 'recovery',
            email: emailFromUrl
          });

          if (error) {
            throw error;
          }

          setIsResettingPassword(true);
          setIsForgotPassword(false);
          setIsLogin(false);
        } catch (error: any) {
          console.error("Token verification error:", error);
          toast({
            variant: "destructive",
            title: t("error"),
            description: "The password reset link is invalid or has expired. Please request a new one.",
            duration: 6000,
          });
          setIsLogin(true);
          setIsForgotPassword(false);
          setIsResettingPassword(false);
        }
      };

      verifyToken();
    }
    
    if (isResetMode && !accessToken && !token) {
      console.log("Reset mode detected but no tokens found yet");
    }
  }, [location, toast, t]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResettingPassword) {
        const params = new URLSearchParams(location.hash.substring(1));
        const access_token = params.get('access_token');
        
        if (!access_token) {
          throw new Error("No access token found. Please request a new password reset link.");
        }

        console.log("Updating password with token");
        
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) throw error;

        toast({
          title: t("success"),
          description: "Password updated successfully. Please login with your new password.",
          duration: 5000,
        });
        
        setIsResettingPassword(false);
        setIsLogin(true);
        setPassword("");
        
      } else if (isForgotPassword) {
        console.log("Sending password reset email to:", email);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=reset`,
        });
        
        if (error) {
          if (error.message.includes('rate limit')) {
            throw new Error("Too many password reset attempts. Please wait a few minutes before trying again.");
          }
          throw error;
        }

        toast({
          title: t("checkEmail"),
          description: "If an account exists with this email, you will receive a password reset link. Please check your spam folder if you don't see it.",
          duration: 6000,
        });
        setIsForgotPassword(false);
      } else if (isLogin) {
        console.log("Attempting to sign in with:", email);
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (error) {
          console.error("Sign in error:", error);
          throw error;
        }

        console.log("Sign in successful:", data);
        
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, title")
          .eq("id", data.user?.id)
          .single();

        if (profileError) {
          console.warn("Error fetching profile:", profileError);
        }

        toast({
          title: "Login successful",
          description: "You have been successfully logged in.",
          duration: 3000,
        });

        navigate("/profile", { replace: true });
      } else {
        console.log("Attempting to sign up with:", email);
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password 
        });

        if (error) {
          console.error("Sign up error:", error);
          throw error;
        }

        console.log("Sign up result:", data);

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
        duration: 6000,
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
            {isResettingPassword 
              ? "Reset Password"
              : isForgotPassword 
                ? t("forgotPassword") 
                : isLogin ? t("login") : t("signup")}
          </h2>
          <p className="mt-2 text-gray-600">
            {isResettingPassword
              ? "Enter your new password"
              : isForgotPassword 
                ? t("forgotPasswordDesc") 
                : isLogin ? t("loginDescription") : t("signupDescription")}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {!isResettingPassword && (
            <div>
              <Input
                type="email"
                placeholder={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!isResettingPassword}
              />
            </div>
          )}
          {(!isForgotPassword || isResettingPassword) && (
            <div>
              <Input
                type="password"
                placeholder={isResettingPassword ? "Enter new password" : t("password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading 
              ? t("loading") 
              : isResettingPassword
                ? "Update Password"
                : isForgotPassword 
                  ? t("sendResetLink")
                  : isLogin ? t("login") : t("signup")}
          </Button>
        </form>

        <div className="text-center space-y-2">
          {!isResettingPassword && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
