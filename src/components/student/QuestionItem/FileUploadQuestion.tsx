"use client";

import { Upload } from "lucide-react";

interface FileUploadQuestionProps {
    file: File | null;
    onFileChange: (file: File | null) => void;
}

export function FileUploadQuestion({ file, onFileChange }: FileUploadQuestionProps) {
    return (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
            <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
            <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="text-slate-600 font-medium">{file ? file.name : "Tap to upload file"}</p>
            </div>
        </div>
    );
}
