"use client";

import { Question, StudentResponse, AnalysisResult } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StopCircle, Play, Trash2 } from "lucide-react";
import { ResponseChart } from "./ResponseChart";

interface QuestionCardProps {
    question: Question;
    responses: StudentResponse[];
    analysis?: AnalysisResult;
    isActive: boolean;
    onToggleActive: (qId: string) => void;
    onDelete: (qId: string) => void;
}

export function QuestionCard({ question, responses, analysis, isActive, onToggleActive, onDelete }: QuestionCardProps) {
    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3 flex flex-row justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CardTitle className="font-serif text-xl">{question.text}</CardTitle>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-slate-100 text-slate-500"}`}>
                            {isActive ? "Presenting Now" : "Hidden"}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => onToggleActive(question.id)}
                        className={`${isActive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                    >
                        {isActive ? (
                            <><StopCircle className="w-4 h-4 mr-2" /> Stop</>
                        ) : (
                            <><Play className="w-4 h-4 mr-2" /> Show Live</>
                        )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(question.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className={`p-6 ${question.isActive === false ? "opacity-50" : ""}`}>
                <ResponseChart question={question} responses={responses} analysis={analysis} />
            </CardContent>
        </Card>
    );
}
