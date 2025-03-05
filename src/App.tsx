
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import JobApplication from "./pages/JobApplication";
import Profile from "./pages/Profile";
import PostJob from "@/pages/PostJob";
import JobApplications from "@/pages/JobApplications";
import ApplicantProfile from "@/pages/ApplicantProfile";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:jobId" element={<JobDetail />} />
              <Route path="/jobs/:jobId/apply" element={<JobApplication />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/post-job" element={<PostJob />} />
              <Route path="/profile/applications" element={<JobApplications />} />
              <Route path="/profile/applicant/:applicantId" element={<ApplicantProfile />} />
              <Route path="/profile/jobs/:jobId/applications" element={<JobApplications />} />
              <Route path="/profile/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
