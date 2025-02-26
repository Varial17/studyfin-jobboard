
import { useState } from "react";
import { Search, Briefcase, Globe, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();

  const featuredJobs = [
    {
      id: 1,
      title: "Software Engineer Intern",
      company: "TechCorp International",
      location: "San Francisco, CA",
      type: "Internship",
      visa: "F1 OPT",
    },
    {
      id: 2,
      title: "Data Scientist",
      company: "Global Analytics Co",
      location: "New York, NY",
      type: "Full-time",
      visa: "H1B Sponsorship",
    },
    {
      id: 3,
      title: "Product Manager",
      company: "Innovation Labs",
      location: "Austin, TX",
      type: "Full-time",
      visa: "CPT Eligible",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      {/* Hero Section */}
      <section className="container px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary animate-fade-in">
          {t("findDreamJob")}
        </h1>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-in">
          {t("opportunities")}
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto flex gap-2 p-2 bg-white rounded-lg shadow-lg animate-fade-in">
          <div className="flex-1 flex items-center px-3 bg-gray-50 rounded-md">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t("search")}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            {t("searchJobs")}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
          {[
            { icon: Briefcase, text: "1000+ " + t("jobsPosted") },
            { icon: Globe, text: "500+ " + t("companies") },
            { icon: MapPin, text: "50+ " + t("locations") },
          ].map((stat, index) => (
            <div
              key={index}
              className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <stat.icon className="w-6 h-6 text-primary mr-2" />
              <span className="text-gray-700">{stat.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="container px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">{t("featuredJobs")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 animate-fade-in"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-500 mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{job.location}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{job.type}</Badge>
                <Badge className="bg-primary">{job.visa}</Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline" className="hover:bg-primary hover:text-white">
            {t("viewAllJobs")}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
