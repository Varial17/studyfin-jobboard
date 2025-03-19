import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';

import {
  Auth,
  Jobs,
  JobDetail,
  JobApplication,
  JobApplications,
  PostJob,
  Profile,
  ApplicantProfile,
  Index,
  Settings,
  NotFound,
  ZohoIntegration,
  ZohoCallback,
  ZohoAdmin
} from './pages';

import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/jobs/:id/apply" element={<JobApplication />} />
            <Route path="/applications" element={<JobApplications />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/zoho" element={<ZohoIntegration />} />
            <Route path="/profile/zoho/admin" element={<ZohoAdmin />} />
            <Route path="/auth/zoho/callback" element={<ZohoCallback />} />
            <Route path="/applicants/:id" element={<ApplicantProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          <Toaster />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
