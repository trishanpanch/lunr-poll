import { db } from "@/lib/firebase/client";
import { doc, runTransaction, increment } from "firebase/firestore";

export async function toggleUpvote(responseId: string, userId: string) {
    const ref = doc(db, "responses", responseId);

    try {
        await runTransaction(db, async (transaction) => {
            const doc = await transaction.get(ref);
            if (!doc.exists()) throw "Document does not exist!";

            const data = doc.data();
            const upvoters = (data.upvoterIds || []) as string[];

            if (upvoters.includes(userId)) {
                // Remove upvote
                transaction.update(ref, {
                    upvotes: increment(-1),
                    upvoterIds: upvoters.filter(id => id !== userId)
                });
            } else {
                // Add upvote
                transaction.update(ref, {
                    upvotes: increment(1),
                    upvoterIds: [...upvoters, userId]
                });
            }
        });
    } catch (e) {
        console.error("Upvote failed", e);
    }
}
