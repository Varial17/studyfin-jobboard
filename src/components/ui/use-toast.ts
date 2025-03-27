
// This file serves as a bridge to the main use-toast.ts hook
import { useToast as useToastHook, toast as toastFunc } from "@/hooks/use-toast";

export const useToast = useToastHook;
export const toast = toastFunc;
