
import { 
  useToast as useShadcnToast,
  type ToastActionElement, 
  type ToastProps 
} from "@/components/ui/toast"

type ToastOptions = ToastProps & {
  description?: string;
  action?: ToastActionElement;
};

export const useToast = () => {
  const { toast: shadcnToast } = useShadcnToast();
  return {
    toast: (options: ToastOptions) => {
      console.log("Toast called with:", options);
      return shadcnToast(options);
    },
    toasts: useShadcnToast().toasts,
  };
};

export const toast = (options: ToastOptions) => {
  console.log("Direct toast called with:", options);
  const { toast: innerToast } = useShadcnToast();
  return innerToast(options);
};
