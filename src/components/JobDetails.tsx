
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

interface JobDetailsProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JobDetails({ job, isOpen, onClose }: JobDetailsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!job) return null;

  const handleApply = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("loginToApply"),
      });
      return;
    }

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
      const { error } = await supabase
        .from("applications")
        .insert({
          job_id: job.id,
          applicant_id: user.id,
          cover_letter: coverLetter,
        });

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("applicationSubmitted"),
      });
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{job.title}</DialogTitle>
          <DialogDescription className="text-lg text-foreground">
            {job.company}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{t("description")}</h3>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </div>
          {job.requirements && (
            <div>
              <h3 className="font-semibold mb-2">{t("requirements")}</h3>
              <p className="whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}
          <div className="space-y-2">
            <h3 className="font-semibold">{t("coverLetter")}</h3>
            <Textarea
              placeholder={t("coverLetterPlaceholder")}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-[200px]"
              disabled={!user}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleApply}
              disabled={isSubmitting || !user}
            >
              {isSubmitting ? t("submitting") : t("apply")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

