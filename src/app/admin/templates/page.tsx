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
    const { data: templates, isLoading, refetch } = api.template.getAll.useQuery();
    const deleteTemplate = api.template.delete.useMutation({
        onSuccess: () => {
            refetch();
        }
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
            <main className="min-h-screen bg-academic-white text-academic-black p-4 md:p-8 font-mono flex flex-col items-center">
                <div className="w-full max-w-6xl animate-pulse">
                    <div className="h-10 w-48 bg-academic-black/10 mb-8 mx-auto border-b-4 border-academic-green"></div>
                    <div className="bg-academic-white border border-academic-black shadow-[8px_8px_0px_#111111] p-6 h-64"></div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-academic-white text-academic-black p-4 md:p-8 font-mono flex flex-col items-center">
            <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b-4 border-academic-green pb-4">
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-academic-black">Templates</h1>
                <Link
                    href="/admin/templates/new"
                    className="bg-academic-black text-academic-white px-6 py-3 font-bold text-sm uppercase tracking-widest shadow-[4px_4px_0px_#48C796] hover:shadow-[2px_2px_0px_#48C796] hover:translate-y-[2px] hover:translate-x-[2px] transition-all border border-academic-black flex items-center gap-2"
                >
                    <FileTextIcon size={18} />
                    <span>New Template</span>
                </Link>
            </div>

            <div className="w-full max-w-6xl bg-academic-white border border-academic-black shadow-[8px_8px_0px_#111111] overflow-x-auto">
                <Table className="w-full text-left text-sm border-collapse min-w-[800px]">
                    <TableHeader className="bg-academic-black/5 border-b-2 border-academic-black text-xs uppercase tracking-widest text-academic-black">
                        <TableRow className="hover:bg-transparent border-0">
                            <TableHead className="px-6 py-4 border-r border-academic-black/20 font-bold text-academic-black h-auto">Title</TableHead>
                            <TableHead className="px-6 py-4 border-r border-academic-black/20 font-bold text-academic-black h-auto">Category</TableHead>
                            <TableHead className="px-6 py-4 border-r border-academic-black/20 font-bold text-academic-black h-auto">Room</TableHead>
                            <TableHead className="px-6 py-4 border-r border-academic-black/20 font-bold text-academic-black h-auto">Status</TableHead>
                            <TableHead className="px-6 py-4 border-r border-academic-black/20 font-bold text-academic-black h-auto">Created</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-center text-academic-black h-auto">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!templates || templates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="px-6 py-12 text-center text-academic-black/60 font-bold uppercase tracking-widest hover:bg-transparent h-auto">
                                    No templates found
                                </TableCell>
                            </TableRow>
                        ) : (
                            templates.map((template, index) => (
                                <TableRow
                                    key={template.id}
                                    className={`border-b border-academic-black/20 hover:bg-academic-green/10 transition-colors ${index % 2 === 0 ? 'bg-academic-white' : 'bg-academic-black/5'}`}
                                >
                                    <TableCell className="px-6 py-4 border-r border-academic-black/20 font-bold h-auto">
                                        {template.title}
                                        <div className="text-[10px] text-academic-black/50 mt-1">{template.fileName}</div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 border-r border-academic-black/20 h-auto">
                                        <span className="bg-academic-black/10 px-2 py-1 text-[10px] font-bold uppercase">{template.category}</span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 border-r border-academic-black/20 font-bold uppercase text-xs h-auto">
                                        {template.room || <span className="text-academic-black/40">GLOBAL</span>}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 border-r border-academic-black/20 h-auto">
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase border flex w-fit items-center gap-1 ${template.status === 'ACTIVE'
                                                ? 'bg-academic-green/20 border-academic-green text-academic-black'
                                                : template.status === 'DRAFT'
                                                    ? 'bg-yellow-100 border-yellow-500 text-yellow-800'
                                                    : 'bg-academic-black/10 border-academic-black/30 text-academic-black'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${template.status === 'ACTIVE' ? 'bg-academic-green' : template.status === 'DRAFT' ? 'bg-yellow-500' : 'bg-academic-black/50'}`}></span>
                                            {template.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 border-r border-academic-black/20 text-xs h-auto">
                                        {format(new Date(template.createdAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 space-x-3 text-center h-auto items-center">
                                        <Link
                                            href={`/template/${template.id}`}
                                            className="inline-block p-2 text-academic-black/60 hover:text-academic-black hover:bg-academic-black/10 border border-transparent hover:border-academic-black transition-all group"
                                            title="View Form"
                                        >
                                            <CopyIcon size={16} className="group-hover:scale-110 transition-transform" />
                                        </Link>
                                        <Link
                                            href={`/admin/templates/${template.id}/edit`}
                                            className="inline-block p-2 text-academic-black/60 hover:text-academic-green hover:bg-academic-black/10 border border-transparent hover:border-academic-black transition-all group"
                                            title="Edit Template"
                                        >
                                            <EditIcon size={16} className="group-hover:scale-110 transition-transform" />
                                        </Link>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button
                                                    disabled={isDeleting === template.id}
                                                    className="inline-block p-2 text-academic-black/60 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-500 transition-all group disabled:opacity-50"
                                                    title="Delete Template"
                                                >
                                                    <TrashIcon size={16} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-academic-white border-2 border-academic-black shadow-[8px_8px_0px_#111111] rounded-none font-mono">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="uppercase tracking-widest font-bold text-academic-black">Delete Template</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-academic-black/70">
                                                        Are you sure you want to delete this template? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-none border-2 border-academic-black hover:bg-academic-black/5 font-bold uppercase tracking-widest text-xs">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(template.id)}
                                                        className="rounded-none bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-xs border-2 border-academic-black shadow-[4px_4px_0px_#111111] hover:shadow-[2px_2px_0px_#111111] hover:translate-y-[2px] transition-all"
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
