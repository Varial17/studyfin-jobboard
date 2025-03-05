
// Create a new file for the toast system
import { ToastProps } from "@/components/ui/toast";
import {
  useToast as useToastShad,
} from "@/components/ui/toast"

export const useToast = useToastShad;

type ToastActionType = {
  altText?: string;
  onClick: () => void;
  children?: React.ReactNode;
};

interface ToastParameters extends Omit<ToastProps, "id"> {
  title?: string;
  description?: string;
  action?: ToastActionType;
  duration?: number;
}

export const toast = ({
  title,
  description,
  variant = "default",
  action,
  duration = 5000, // Default duration
  ...props
}: ToastParameters) => {
  const { toast } = useToastShad();
  
  console.log("Toast called with:", {
    title, 
    description,
    variant,
    action,
    duration,
    ...props
  });
  
  return toast({
    title,
    description,
    variant,
    action,
    duration,
    ...props,
  });
};
