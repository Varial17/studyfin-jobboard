
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, InfoIcon } from "lucide-react";

interface StatusAlertsProps {
  error: string | null;
  debugInfo: string | null;
}

export function StatusAlerts({ error, debugInfo }: StatusAlertsProps) {
  if (!error && !debugInfo) return null;

  return (
    <div className="space-y-3 mb-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {debugInfo && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertTitle>Debug Information</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap overflow-auto max-h-32 text-sm">
            {debugInfo}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
