
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    navigate(`/jobs?${params.toString()}`);
  };

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
    <div className="min-h-screen bg-[#F8F8FD]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container px-4 md:px-8 pt-16 lg:pt-24">
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

            {/* Search Bar */}
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
                  className="w-full md:w-auto bg-[#4640DE] hover:bg-[#4640DE]/90 text-white px-8 transition-all duration-300 hover:scale-105"
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
            className="hidden lg:block relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse" />
            <img
              src="/lovable-uploads/b6036afc-422e-4dc6-bdc2-936db28c6bc2.png"
              alt="Hero"
              className="relative w-full h-auto object-cover rounded-lg hover:scale-[1.02] transition-transform duration-500"
            />
          </motion.div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {[
            { icon: Building2, text: "1000+ " + t("jobsPosted"), color: "from-blue-500/20 to-blue-500/5" },
            { icon: Users, text: "500+ " + t("companies"), color: "from-purple-500/20 to-purple-500/5" },
            { icon: MapPin, text: "50+ " + t("locations"), color: "from-pink-500/20 to-pink-500/5" },
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

      {/* Featured Jobs Section */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
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
                  {job.type}
                </Badge>
                <Badge className="bg-primary">{job.visa}</Badge>
              </div>
            </motion.div>
          ))}
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

