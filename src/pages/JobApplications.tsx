import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { useToast } from "@/components/ui/use-toast";
import { Github, Linkedin, Phone } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Application = {
  id: string;
  status: string;
  created_at: string;
  job: {
    title: string;
    company: string;
  };
  applicant: {
    id: string;
    full_name: string;
    title: string;
    cv_url: string | null;
    phone_number?: string;
    github_url?: string;
    linkedin_url?: string;
  };
  cover_letter: string | null;
};

const JobApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchApplications = async () => {
      try {
        const { data, error } = await supabase
          .from("applications")
          .select(`
            id,
            status,
            created_at,
            cover_letter,
            jobs (
              title,
              company
            ),
            profiles!applications_applicant_id_fkey (
              id,
              full_name,
              title,
              cv_url,
              phone_number,
              github_url,
              linkedin_url
            )
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setApplications(
          data.map((app) => ({
            ...app,
            job: app.jobs,
            applicant: app.profiles,
          }))
        );
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, navigate, t, toast]);

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));

      toast({
        title: t("success"),
        description: t("applicationStatusUpdated"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    }
  };

  const handleRowClick = (applicantId: string) => {
    navigate(`/profile/applicant/${applicantId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <span className="text-lg">{t("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Navbar />
      <div className="flex">
        <ProfileSidebar />
        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">{t("jobApplications")}</h1>
            
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t("noApplications")}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("applicantName")}</TableHead>
                      <TableHead>{t("jobTitle")}</TableHead>
                      <TableHead>{t("company")}</TableHead>
                      <TableHead>{t("appliedDate")}</TableHead>
                      <TableHead>{t("resume")}</TableHead>
                      <TableHead>{t("contact")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow 
                        key={application.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700"
                        onClick={() => handleRowClick(application.applicant?.id)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium hover:text-blue-600">
                              {application.applicant?.full_name || t("unnamed")}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {application.applicant?.title || t("noTitle")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{application.job.title}</TableCell>
                        <TableCell>{application.job.company}</TableCell>
                        <TableCell>
                          {new Date(application.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {application.applicant?.cv_url ? (
                            <a
                              href={application.applicant.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("viewCV")}
                            </a>
                          ) : (
                            <span className="text-gray-500">{t("noCVUploaded")}</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            {application.applicant?.phone_number && (
                              <a
                                href={`tel:${application.applicant.phone_number}`}
                                className="text-gray-600 hover:text-blue-600"
                                title={application.applicant.phone_number}
                              >
                                <Phone className="w-5 h-5" />
                              </a>
                            )}
                            {application.applicant?.github_url && (
                              <a
                                href={application.applicant.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-blue-600"
                                title="GitHub Profile"
                              >
                                <Github className="w-5 h-5" />
                              </a>
                            )}
                            {application.applicant?.linkedin_url && (
                              <a
                                href={application.applicant.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-blue-600"
                                title="LinkedIn Profile"
                              >
                                <Linkedin className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            defaultValue={application.status}
                            onValueChange={(value) =>
                              updateApplicationStatus(application.id, value)
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new_cv">New CV</SelectItem>
                              <SelectItem value="reviewing">Reviewing</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="offer">Offer</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobApplications;
