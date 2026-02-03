import { useState, useEffect } from "react";
import { Activity } from "@/lib/types";
import { submitResponse } from "@/lib/data/responses";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface RankingParticipantProps {
    activity: Activity;
    participantId: string;
}

function SortableItem({ id, text }: { id: string; text: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white border rounded-lg p-4 mb-3 flex items-center shadow-sm select-none touch-none ${isDragging ? "border-slate-400 shadow-lg" : "border-slate-200"
                }`}
        >
            <div {...attributes} {...listeners} className="mr-3 cursor-grab active:cursor-grabbing text-slate-400">
                <GripVertical className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700">{text}</span>
        </div>
    );
}

export function RankingParticipant({ activity, participantId }: RankingParticipantProps) {
    const [items, setItems] = useState<{ id: string; text: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (activity.options) {
            setItems(activity.options.map((o) => ({ id: o.id, text: o.content.text })));
        }
    }, [activity]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Content is the ORDERED list of IDs
            const order = items.map((i) => i.id);
            await submitResponse(activity.id, participantId, { order });
            setSubmitted(true);
            toast.success("Ranking submitted!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to submit");
        } finally {
            setSubmitting(false);
        }
    };

    if (!activity.options || activity.options.length === 0) {
        return <div className="text-center p-8">No options to rank.</div>;
    }

    return (
        <div className="max-w-xl mx-auto p-4 w-full">
            <h1 className="text-xl font-serif font-bold text-center mb-2">{activity.prompt.text}</h1>
            <p className="text-center text-slate-500 mb-6 text-sm">Drag to reorder your preference.</p>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                        <SortableItem key={item.id} id={item.id} text={item.text} />
                    ))}
                </SortableContext>
            </DndContext>

            <div className="mt-8">
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || submitted}
                    className="w-full"
                    size="lg"
                >
                    {submitting ? "Sending..." : submitted ? "Updated" : "Submit Ranking"}
                </Button>
            </div>
        </div>
    );
}
