
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Auto-redirect to home page after 5 seconds
    const redirectTimeout = setTimeout(() => {
      navigate('/');
    }, 5000);
    
    return () => clearTimeout(redirectTimeout);
  }, [location.pathname, navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        <p className="text-sm text-gray-500 mb-6">Redirecting to homepage in 5 seconds...</p>
        <Button 
          onClick={handleGoHome} 
          className="inline-flex items-center gap-2"
        >
          <Home size={18} />
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
