
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface StatusAlertsProps {
  error: string | null;
  debugInfo: string | null;
}

export function StatusAlerts({ error, debugInfo }: StatusAlertsProps) {
  if (!error && !debugInfo) return null;

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {debugInfo && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Debug Information</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap overflow-auto max-h-32">
            {debugInfo}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
