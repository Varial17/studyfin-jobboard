
import { useParams, Link, useNavigate } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import type { Database } from "@/integrations/supabase/types";
import { JobDetails } from "@/components/JobDetails";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

const JobDetail = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchUserRole = async () => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(); // Using maybeSingle instead of single

          if (error) throw error;
          // Handle case where role property might not exist yet
          setUserRole((data as any)?.role || 'applicant');
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      };

      fetchUserRole();
    }
  }, [user]);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      console.log("Fetching job with ID:", id);
      if (!id) throw new Error("Job ID is required");
      
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Job data:", data);
      return data as Job | null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="animate-pulse">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 w-2/3">
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-20 rounded-md" />
                    <Skeleton className="h-10 w-20 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                  <Skeleton className="h-6 w-40 rounded-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 animate-pulse">
              <div>
                <Skeleton className="h-6 w-40 mb-2 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
              </div>
              <div>
                <Skeleton className="h-6 w-40 mb-2 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="animate-pulse">
              <Skeleton className="h-10 w-full rounded-md" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Job</h2>
            <p className="mb-4">We encountered an error while loading this job.</p>
            <Button asChild>
              <Link to="/jobs">Go Back to Jobs</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
            <p className="mb-4">The job listing you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/jobs">Browse All Jobs</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleApplyClick = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    if (userRole === 'employer') {
      setShowRoleDialog(true);
      return;
    }
    
    // Open the apply dialog directly instead of showing the job details again
    setIsApplyDialogOpen(true);
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
                  <h1 className="text-2xl font-bold">{job?.title}</h1>
                  <p className="text-lg text-muted-foreground">{job?.company}</p>
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
                <span>{job?.location}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{job?.job_type}</Badge>
                {job?.salary_range && (
                  <Badge variant="secondary">{job.salary_range}</Badge>
                )}
                {job?.visa_sponsorship && (
                  <Badge className="bg-primary">{t("visaSponsorship")}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">{t("description")}</h2>
              <p className="whitespace-pre-wrap">{job?.description}</p>
            </div>
            {job?.requirements && (
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

      {/* Apply Dialog */}
      {job && (
        <JobDetails
          job={job}
          isOpen={isApplyDialogOpen}
          onClose={() => setIsApplyDialogOpen(false)}
        />
      )}

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("loginToApply")}</DialogTitle>
            <DialogDescription>
              {t("pleaseCompleteProfile")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLoginDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button 
              onClick={() => {
                setShowLoginDialog(false);
                navigate("/auth");
              }}
            >
              {t("login")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("accessDenied")}</DialogTitle>
            <DialogDescription>
              {t("applicantRoleRequired")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button 
              onClick={() => {
                setShowRoleDialog(false);
                navigate("/profile");
              }}
            >
              {t("updateProfile")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetail;
