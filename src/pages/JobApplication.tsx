
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch job details
  const { data: job, isLoading: isJobLoading } = useQuery({
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

  // Check if user has already applied
  const { data: existingApplication, isLoading: isCheckingApplication } = useQuery({
    queryKey: ["application", jobId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", jobId)
        .eq("applicant_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!jobId,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="mb-4">{t("loginToApply")}</p>
            <Button asChild>
              <Link to="/auth">{t("login")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isJobLoading || isCheckingApplication) {
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

  if (existingApplication) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="mb-4">You have already applied for this position.</p>
              <Button asChild>
                <Link to={`/jobs/${jobId}`}>{t("back")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!coverLetter.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("coverLetterRequired"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert the application
      const { data: application, error } = await supabase
        .from("applications")
        .insert({
          job_id: job.id,
          applicant_id: user.id,
          cover_letter: coverLetter,
          zoho_synced: false,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Check if employer has Zoho connected
      const { data: employerProfile } = await supabase
        .from("profiles")
        .select("zoho_connected")
        .eq("id", job.employer_id)
        .single();

      // If Zoho is connected, sync the application
      if (employerProfile?.zoho_connected) {
        try {
          await supabase.functions.invoke('sync-job-application', {
            body: { applicationId: application.id }
          });
        } catch (syncError) {
          console.error("Error syncing to Zoho:", syncError);
          // Continue even if sync fails
        }
      }

      toast({
        title: t("success"),
        description: t("applicationSubmitted"),
      });
      navigate(`/jobs/${jobId}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                  {t("applyingFor")} {job.title}
                </h1>
                <Button variant="outline" asChild>
                  <Link to={`/jobs/${jobId}`}>{t("back")}</Link>
                </Button>
              </div>
              <p className="text-lg text-muted-foreground">{job.company}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-semibold">{t("coverLetter")}</h2>
              <Textarea
                placeholder={t("coverLetterPlaceholder")}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="min-h-[300px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              asChild
            >
              <Link to={`/jobs/${jobId}`}>{t("cancel")}</Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default JobApplication;
