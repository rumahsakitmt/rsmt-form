"use client";

import { api } from "@/trpc/react";
import Link from "next/link";
import { format } from "date-fns";
import { CopyIcon, EditIcon, FileTextIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TemplatesListPage() {
  const {
    data: templates,
    isLoading,
    refetch,
  } = api.template.getAll.useQuery();
  const deleteTemplate = api.template.delete.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteTemplate.mutateAsync({ id });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <main className="bg-academic-white text-academic-black flex min-h-screen flex-col items-center p-4 font-mono md:p-8">
        <div className="w-full max-w-6xl animate-pulse">
          <div className="bg-academic-black/10 border-academic-green mx-auto mb-8 h-10 w-48 border-b-4"></div>
          <div className="bg-academic-white border-academic-black h-64 border p-6 shadow-[8px_8px_0px_#111111]"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-academic-white text-academic-black flex min-h-screen flex-col items-center p-4 font-mono md:p-8">
      <div className="border-academic-green mb-8 flex w-full max-w-6xl flex-col items-center justify-between gap-4 border-b-4 pb-4 sm:flex-row">
        <h1 className="text-academic-black text-2xl font-bold tracking-widest uppercase md:text-3xl">
          Templates
        </h1>
        <Link
          href="/admin/templates/new"
          className="bg-academic-black text-academic-white border-academic-black flex items-center gap-2 border px-6 py-3 text-sm font-bold tracking-widest uppercase shadow-[4px_4px_0px_#48C796] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#48C796]"
        >
          <FileTextIcon size={18} />
          <span>New Template</span>
        </Link>
      </div>

      <div className="bg-academic-white border-academic-black w-full max-w-6xl overflow-x-auto border shadow-[8px_8px_0px_#111111]">
        <Table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <TableHeader className="bg-academic-black/5 border-academic-black text-academic-black border-b-2 text-xs tracking-widest uppercase">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="border-academic-black/20 text-academic-black h-auto border-r px-6 py-4 font-bold">
                Title
              </TableHead>
              <TableHead className="border-academic-black/20 text-academic-black h-auto border-r px-6 py-4 font-bold">
                Category
              </TableHead>
              <TableHead className="border-academic-black/20 text-academic-black h-auto border-r px-6 py-4 font-bold">
                Room
              </TableHead>
              <TableHead className="border-academic-black/20 text-academic-black h-auto border-r px-6 py-4 font-bold">
                Status
              </TableHead>
              <TableHead className="border-academic-black/20 text-academic-black h-auto border-r px-6 py-4 font-bold">
                Created
              </TableHead>
              <TableHead className="text-academic-black h-auto px-6 py-4 text-center font-bold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!templates || templates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-academic-black/60 h-auto px-6 py-12 text-center font-bold tracking-widest uppercase hover:bg-transparent"
                >
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template, index) => (
                <TableRow
                  key={template.id}
                  className={`border-academic-black/20 hover:bg-academic-green/10 border-b transition-colors ${index % 2 === 0 ? "bg-academic-white" : "bg-academic-black/5"}`}
                >
                  <TableCell className="border-academic-black/20 h-auto border-r px-6 py-4 font-bold">
                    {template.title}
                    <div className="text-academic-black/50 mt-1 text-[10px]">
                      {template.fileName}
                    </div>
                  </TableCell>
                  <TableCell className="border-academic-black/20 h-auto border-r px-6 py-4">
                    <span className="bg-academic-black/10 px-2 py-1 text-[10px] font-bold uppercase">
                      {template.category}
                    </span>
                  </TableCell>
                  <TableCell className="border-academic-black/20 h-auto border-r px-6 py-4 text-xs font-bold uppercase">
                    {template.room ?? (
                      <span className="text-academic-black/40">GLOBAL</span>
                    )}
                  </TableCell>
                  <TableCell className="border-academic-black/20 h-auto border-r px-6 py-4">
                    <span
                      className={`flex w-fit items-center gap-1 border px-2 py-1 text-[10px] font-bold uppercase ${
                        template.status === "ACTIVE"
                          ? "bg-academic-green/20 border-academic-green text-academic-black"
                          : template.status === "DRAFT"
                            ? "border-yellow-500 bg-yellow-100 text-yellow-800"
                            : "bg-academic-black/10 border-academic-black/30 text-academic-black"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${template.status === "ACTIVE" ? "bg-academic-green" : template.status === "DRAFT" ? "bg-yellow-500" : "bg-academic-black/50"}`}
                      ></span>
                      {template.status}
                    </span>
                  </TableCell>
                  <TableCell className="border-academic-black/20 h-auto border-r px-6 py-4 text-xs">
                    {format(new Date(template.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="h-auto items-center space-x-3 px-6 py-4 text-center">
                    <Link
                      href={`/template/${template.id}`}
                      className="text-academic-black/60 hover:text-academic-black hover:bg-academic-black/10 hover:border-academic-black group inline-block border border-transparent p-2 transition-all"
                      title="View Form"
                    >
                      <CopyIcon
                        size={16}
                        className="transition-transform group-hover:scale-110"
                      />
                    </Link>
                    <Link
                      href={`/admin/templates/${template.id}/edit`}
                      className="text-academic-black/60 hover:text-academic-green hover:bg-academic-black/10 hover:border-academic-black group inline-block border border-transparent p-2 transition-all"
                      title="Edit Template"
                    >
                      <EditIcon
                        size={16}
                        className="transition-transform group-hover:scale-110"
                      />
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={isDeleting === template.id}
                          className="text-academic-black/60 group inline-block border border-transparent p-2 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          title="Delete Template"
                        >
                          <TrashIcon
                            size={16}
                            className="transition-transform group-hover:scale-110"
                          />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-academic-white border-academic-black rounded-none border-2 font-mono shadow-[8px_8px_0px_#111111]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-academic-black font-bold tracking-widest uppercase">
                            Delete Template
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-academic-black/70">
                            Are you sure you want to delete this template? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-academic-black hover:bg-academic-black/5 rounded-none border-2 text-xs font-bold tracking-widest uppercase">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                            className="border-academic-black rounded-none border-2 bg-red-500 text-xs font-bold tracking-widest text-white uppercase shadow-[4px_4px_0px_#111111] transition-all hover:translate-y-[2px] hover:bg-red-600 hover:shadow-[2px_2px_0px_#111111]"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
