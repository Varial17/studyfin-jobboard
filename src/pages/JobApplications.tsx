
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { supabase } from "@/integrations/supabase/client";

type ApplicationStatus = "new_cv" | "interviewed" | "job_offer" | "rejected" | "hired";

type Application = {
  id: string;
  applicant: {
    full_name: string | null;
    location: string | null;
  };
  status: ApplicationStatus;
  created_at: string;
};

const statusColors: Record<ApplicationStatus, { color: string; label: string }> = {
  new_cv: { color: "bg-blue-500", label: "New CV" },
  interviewed: { color: "bg-purple-500", label: "Interviewed" },
  job_offer: { color: "bg-yellow-500", label: "Job Offer" },
  rejected: { color: "bg-red-500", label: "Rejected" },
  hired: { color: "bg-green-500", label: "Hired" },
};

const JobApplications = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          created_at,
          applicant:profiles (
            full_name,
            location
          )
        `)
        .eq("job_id", jobId);

      if (error) throw error;
      return data as Application[];
    },
  });

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Application status has been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update application status.",
      });
    }
  };

  const columns = [
    {
      accessorKey: "applicant.full_name",
      header: "Name",
    },
    {
      accessorKey: "applicant.location",
      header: "Location",
    },
    {
      accessorKey: "created_at",
      header: "Applied",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as ApplicationStatus;
        const { color, label } = statusColors[status];
        
        return (
          <Select
            value={status}
            onValueChange={(value: ApplicationStatus) => 
              handleStatusChange(row.original.id, value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue>
                <Badge className={color}>{label}</Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusColors).map(([value, { label, color }]) => (
                <SelectItem key={value} value={value}>
                  <Badge className={color}>{label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
  ];

  const table = useReactTable({
    data: applications || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ProfileSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Job Applications</h1>
          
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No applications found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end p-4 space-x-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobApplications;
