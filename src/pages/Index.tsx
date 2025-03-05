import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, Users, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Globe } from "@/components/ui/globe";
import { supabase, checkSupabaseConnection, resetConnectionAndRetry } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyConnection = async () => {
      try {
        console.log("Verifying connection on Index page...");
        const connected = await checkSupabaseConnection(true);
        console.log("Connection verification result:", connected);
        setConnectionStatus(connected);
        
        if (!connected) {
          console.log("Showing connection error toast");
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Could not connect to the database. Please check your internet connection.",
          });
        }
      } catch (error) {
        console.error("Error in verifyConnection:", error);
        setConnectionStatus(false);
      }
    };
    
    verifyConnection();
  }, []);

  const handleRetryConnection = async () => {
    console.log("Manually retrying connection...");
    await resetConnectionAndRetry();
    const connected = await checkSupabaseConnection(true);
    setConnectionStatus(connected);
    
    if (connected) {
      console.log("Connection restored, refetching data");
      refetch();
      toast({
        title: "Connection restored",
        description: "Successfully reconnected to the database.",
      });
    } else {
      console.log("Connection retry failed");
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Could not connect to the database. Please try again later.",
      });
    }
  };

  const { data: featuredJobs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['featuredJobs'],
    queryFn: async () => {
      console.log("Fetching featured jobs");
      try {
        // Simple connection test first
        const { data: connectionCheck, error: connectionError } = await supabase
          .from('jobs')
          .select('count(*)', { count: 'exact', head: true })
          .limit(1);
          
        if (connectionError) {
          console.error("Connection check failed:", connectionError);
          throw new Error("Cannot connect to database");
        }

        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) {
          console.error('Error fetching featured jobs:', error);
          throw error;
        }

        console.log("Featured jobs fetched successfully:", data?.length || 0, "jobs");
        return data || [];
      } catch (err: any) {
        console.error('Exception in featuredJobs query:', err);
        throw new Error(err.message || "Failed to fetch jobs");
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: connectionStatus !== false,
  });

  useEffect(() => {
    if (error && !error.message?.includes("connect to database")) {
      console.error("Error loading featured jobs:", error);
      toast({
        variant: "destructive",
        title: "Error loading jobs",
        description: "Could not load featured jobs. Please try again later.",
      });
    }
  }, [error]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    navigate(`/jobs?${params.toString()}`);
  };

  useEffect(() => {
    const testConnection = async () => {
      await supabase.auth.getSession();
      console.log("Auth session checked on Index page");
    };
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <Navbar />
      
      <section className="container px-4 md:px-8 pt-16 lg:pt-24">
        {connectionStatus === false && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <div>Could not connect to the database. Some features may not work properly.</div>
              <Button 
                variant="outline" 
                size="sm"
                className="ml-4 bg-white text-red-600 border-red-300 hover:bg-gray-100"
                onClick={handleRetryConnection}
              >
                Retry Connection
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-[#25324B]">
              {t("findDreamJob")}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "6rem" }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-2 bg-primary mt-2"
              />
            </h1>
            <p className="text-[#515B6F] text-lg md:text-xl max-w-xl">
              {t("opportunities")}
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-4 space-y-4"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center gap-3 p-3 border rounded-md">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t("search")}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button 
                  className="w-full md:w-auto bg-[#1EAEDB] hover:bg-[#1EAEDB]/90 text-white px-8 transition-all duration-300 hover:scale-105"
                  onClick={handleSearch}
                >
                  {t("searchJobs")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-[#515B6F]">
                <span className="text-gray-500">Popular:</span>
                {["Software Engineer", "Data Scientist", "Product Manager", "UI/UX Designer"].map((term) => (
                  <button
                    key={term}
                    className="hover:text-primary transition-colors duration-300"
                    onClick={() => {
                      setSearchQuery(term);
                      handleSearch();
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block h-[600px]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse" />
            <Globe className="hover:scale-105 transition-transform duration-500" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {[
            { icon: Building2, text: "100+ " + t("jobsPosted"), color: "from-blue-500/20 to-blue-500/5" },
            { icon: Users, text: t("companies"), color: "from-purple-500/20 to-purple-500/5" },
            { icon: MapPin, text: t("locations"), color: "from-pink-500/20 to-pink-500/5" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-xl bg-gradient-to-br ${stat.color} backdrop-blur-sm border border-white/10 transition-all duration-300`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-lg font-semibold text-[#25324B]">{stat.text}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container px-4 py-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-8 text-center text-[#25324B]"
        >
          {t("featuredJobs")}
        </motion.h2>
        
        {connectionStatus === false && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <p className="font-medium">Database connection error</p>
            <p className="text-sm">We're having trouble connecting to our database. Jobs may not load properly.</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2 text-red-600 border-red-300"
              onClick={() => {
                checkSupabaseConnection().then(connected => {
                  setConnectionStatus(connected);
                  if (connected) {
                    refetch();
                    toast({
                      title: "Connection restored",
                      description: "Successfully reconnected to the database.",
                    });
                  }
                });
              }}
            >
              Retry Connection
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))
          ) : featuredJobs.length > 0 ? (
            featuredJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 cursor-pointer"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-[#25324B]">{job.title}</h3>
                    <p className="text-[#515B6F]">{job.company}</p>
                  </div>
                </div>
                <div className="flex items-center text-[#515B6F] mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{job.location}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-[#F8F8FD] text-[#515B6F]">
                    {job.job_type}
                  </Badge>
                  {job.visa_sponsorship && (
                    <Badge className="bg-primary">
                      {t("visaSponsorship")}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500 py-8">
              No featured jobs available at the moment.
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 mx-auto block"
                onClick={() => refetch()}
              >
                Refresh
              </Button>
            </div>
          )}
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-8"
        >
          <Button 
            variant="outline" 
            className="hover:bg-primary hover:text-white transition-all duration-300 hover:scale-105"
            onClick={() => navigate("/jobs")}
          >
            {t("viewAllJobs")}
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
