
import { useParams, Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

const JobDetail = () => {
  const { jobId } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) throw error;
      return data as Job;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Job not found</div>
        </div>
      </div>
    );
  }

  const handleApplyClick = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("loginToApply"),
      });
      return;
    }
    // Navigate to application page
    window.open(`/jobs/${jobId}/apply`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{job.title}</h1>
                  <p className="text-lg text-muted-foreground">{job.company}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/jobs">{t("back")}</Link>
                  </Button>
                  <Button onClick={handleApplyClick}>
                    {t("apply")}
                  </Button>
                </div>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{job.location}</span>
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
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">{t("description")}</h2>
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>
            {job.requirements && (
              <div>
                <h2 className="text-lg font-semibold mb-2">{t("requirements")}</h2>
                <p className="whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleApplyClick}>
              {t("apply")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default JobDetail;
