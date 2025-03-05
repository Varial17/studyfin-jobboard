
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Filter, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { supabase, checkSupabaseConnection, resetConnectionAndRetry } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const [filters, setFilters] = useState({
    location: "",
    salary: "",
    experience: "",
    type: "",
  });
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);

  const searchQuery = searchParams.get("q") || "";
  const locationFilter = filters.location;

  useEffect(() => {
    const verifyConnection = async () => {
      try {
        console.log("Verifying connection on Jobs page...");
        const connected = await checkSupabaseConnection(true);
        console.log("Connection verification result:", connected);
        setConnectionStatus(connected);
        
        if (!connected) {
          console.log("Showing connection error toast");
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Could not connect to the database. Please check your network connection.",
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
    const connected = await resetConnectionAndRetry();
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

  const { data: jobs = [], isLoading, error, refetch } = useQuery({
    queryKey: ["jobs", searchQuery, locationFilter],
    queryFn: async () => {
      console.log("Fetching jobs with query:", searchQuery, "location:", locationFilter);
      
      try {
        // Simple connection check first
        const { data: connectionCheck, error: connectionError } = await supabase
          .from('jobs')
          .select('count(*)', { count: 'exact', head: true })
          .limit(1);
          
        if (connectionError) {
          console.error("Connection check failed:", connectionError);
          throw new Error("Cannot connect to database");
        }
        
        // Proceed with the actual query
        let query = supabase
          .from("jobs")
          .select("*")
          .order("created_at", { ascending: false });

        if (searchQuery) {
          query = query.ilike("title", `%${searchQuery}%`);
        }

        if (locationFilter) {
          query = query.ilike("location", `%${locationFilter}%`);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching jobs:", error);
          throw error;
        }
        
        console.log("Jobs fetched successfully:", data ? data.length : 0, "jobs");
        return data || [];
      } catch (error: any) {
        console.error("Error in job fetch function:", error);
        if (!error.message.includes("connect to database")) {
          toast({
            variant: "destructive",
            title: t("error"),
            description: `Error loading jobs: ${error.message}`,
          });
        }
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    enabled: connectionStatus !== false,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
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
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center px-3 bg-gray-50 rounded-md">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t("search")}
                className="border-0 bg-transparent focus-visible:ring-0"
                value={searchParams.get("q") || ""}
                onChange={(e) => {
                  const newParams = new URLSearchParams(searchParams);
                  if (e.target.value) {
                    newParams.set("q", e.target.value);
                  } else {
                    newParams.delete("q");
                  }
                  setSearchParams(newParams);
                }}
              />
            </div>
            <div className="flex items-center px-3 bg-gray-50 rounded-md">
              <MapPin className="w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Location"
                className="border-0 bg-transparent focus-visible:ring-0"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />
            </div>
            <Button 
              className="w-full md:w-auto bg-primary hover:bg-primary/90"
              onClick={() => {
                console.log("Search button clicked with filters:", { searchQuery, locationFilter });
                refetch();
              }}
            >
              Search Jobs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5" />
              <h2 className="font-semibold">Filters</h2>
            </div>
            <Separator className="mb-4" />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{jobs.length} Jobs</h2>
              <Button variant="outline">
                Sort by: Recent
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm p-6">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500 font-medium mb-2">Error loading jobs</p>
                <p className="text-sm text-gray-500 mb-4">
                  We encountered a problem connecting to our database.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                  className="mx-auto"
                >
                  Try Again
                </Button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm p-6">
                <p className="text-gray-500 mb-2">No jobs found</p>
                <p className="text-sm text-gray-400">
                  Try changing your search criteria or check back later for new listings.
                </p>
              </div>
            ) : (
              jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                      <p className="text-gray-600">{job.company}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {job.created_at ? new Date(job.created_at).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{job.location}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{job.job_type}</Badge>
                    {job.salary_range && (
                      <Badge variant="secondary">{job.salary_range}</Badge>
                    )}
                    {job.visa_sponsorship && (
                      <Badge className="bg-primary">{t("visaSponsorship")}</Badge>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
