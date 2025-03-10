
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileSidebar } from "@/components/ProfileSidebar";

type JobFormData = {
  title: string;
  company: string;
  location: string;
  job_type: string;
  description: string;
  requirements: string;
  salary_range: string;
  visa_sponsorship: boolean;
};

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: "",
    location: "",
    job_type: "Full-time",
    description: "",
    requirements: "",
    salary_range: "",
    visa_sponsorship: false,
  });

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setUserRole(data?.role || null);
        
        // Redirect if user is not an employer
        if (data?.role !== 'employer') {
          toast({
            title: t("accessDenied"),
            description: t("employerRoleRequired"),
            variant: "destructive",
          });
          navigate('/profile');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, navigate, toast, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t("error"),
        description: "You must be logged in to post a job",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("jobs")
        .insert({
          ...formData,
          employer_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job posted successfully!",
      });

      navigate("/profile/jobs");
    } catch (error) {
      console.error("Error posting job:", error);
      toast({
        title: t("error"),
        description: "Failed to post job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex justify-center items-center">
        <p className="text-lg">{t("loading")}...</p>
      </div>
    );
  }

  // Only show the form if user is an employer
  if (userRole !== 'employer') {
    return null; // This shouldn't render as the user should be redirected
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <ProfileSidebar />
          <div className="flex-1 max-w-3xl">
            <h1 className="text-2xl font-semibold mb-6">Post a New Job</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Job Title
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-1">
                    Company Name
                  </label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Your company name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-1">
                    Location
                  </label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="job_type" className="block text-sm font-medium mb-1">
                    Job Type
                  </label>
                  <select
                    id="job_type"
                    value={formData.job_type}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="salary_range" className="block text-sm font-medium mb-1">
                    Salary Range
                  </label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    placeholder="e.g. $80,000 - $100,000"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Job Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role and responsibilities"
                    className="min-h-[150px]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium mb-1">
                    Requirements
                  </label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="List the required skills and qualifications"
                    className="min-h-[150px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="visa_sponsorship"
                    checked={formData.visa_sponsorship}
                    onChange={(e) => setFormData({ ...formData, visa_sponsorship: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="visa_sponsorship" className="text-sm font-medium">
                    Offer Visa Sponsorship
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Post Job"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
