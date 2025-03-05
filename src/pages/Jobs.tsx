
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/components/ui/use-toast";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    location: "",
    salary: "",
    experience: "",
    type: "",
  });

  const searchQuery = searchParams.get("q") || "";
  const locationFilter = filters.location;

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ["jobs", searchQuery, locationFilter],
    queryFn: async () => {
      console.log("Fetching jobs with query:", searchQuery, "location:", locationFilter);
      
      // Start with the base query
      let query = supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      // Add filters if provided
      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      if (locationFilter) {
        query = query.ilike("location", `%${locationFilter}%`);
      }

      // Execute the query
      const { data, error } = await query;
      
      // Log the results for debugging
      if (error) {
        console.error("Error fetching jobs:", error);
        toast({
          variant: "destructive",
          title: t("error"),
          description: `Error loading jobs: ${error.message}`,
        });
        throw error;
      }
      
      console.log("Jobs fetched:", data ? data.length : 0);
      console.log("First job (if any):", data && data.length > 0 ? data[0] : "No jobs found");
      
      return data || [];
    },
  });

  // If there's an error, display it
  if (error) {
    console.error("Error in jobs component:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
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
            <Button className="w-full md:w-auto bg-primary hover:bg-primary/90">
              Search Jobs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="bg-white p-4 rounded-lg shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5" />
              <h2 className="font-semibold">Filters</h2>
            </div>
            <Separator className="mb-4" />
            {/* Add filter sections here */}
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{jobs.length} Jobs</h2>
              <Button variant="outline">
                Sort by: Recent
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading jobs...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error loading jobs. Please try again later.
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
                      {new Date(job.created_at!).toLocaleDateString()}
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
