
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MapPin, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const [filters, setFilters] = useState({
    location: "",
    salary: "",
    experience: "",
    type: "",
  });

  const jobs = [
    {
      id: 1,
      title: "Software Engineer Intern",
      company: "TechCorp International",
      location: "San Francisco, CA",
      type: "Internship",
      visa: "F1 OPT",
      salary: "$50-55k",
      description: "Join our dynamic team to build innovative solutions...",
      postedAt: "2 days ago",
    },
    // ... Add more job listings as needed
  ];

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
            {/* Filter sections */}
            {/* Add filter sections for salary range, experience level, job type, etc. */}
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">3177 Jobs</h2>
              <Button variant="outline">
                Sort by: Recent
              </Button>
            </div>
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                    <p className="text-gray-600">{job.company}</p>
                  </div>
                  <span className="text-sm text-gray-500">{job.postedAt}</span>
                </div>
                <div className="flex items-center text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{job.location}</span>
                </div>
                <p className="text-gray-600 mb-4">{job.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{job.type}</Badge>
                  <Badge variant="secondary">{job.salary}</Badge>
                  <Badge className="bg-primary">{job.visa}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
