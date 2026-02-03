import { Question, StudentResponse } from "./types";

export const downloadCSV = (
    filename: string,
    questions: Question[],
    responses: StudentResponse[]
) => {
    // 1. Header Row
    const headers = ["Participant ID", "Timestamp"];
    questions.forEach((q) => headers.push(`Q: ${q.text.replace(/"/g, '""')}`)); // Escape quotes

    // 2. Data Rows
    const rows = responses.map((r) => {
        // Format timestamp
        const time = r.submittedAt?.seconds
            ? new Date(r.submittedAt.seconds * 1000).toLocaleString()
            : "N/A";

        const row = [r.studentId, time];

        // Align answers with question order
        questions.forEach((q) => {
            let ans = r.answers[q.id] || "";
            // Handle special types if needed (e.g. JSON objects for drag/drop)
            if (typeof ans === "object") {
                ans = JSON.stringify(ans);
            }
            // Escape CSV text (wrap in quotes, escape internal quotes)
            row.push(`"${String(ans).replace(/"/g, '""')}"`);
        });

        return row.join(",");
    });

    // 3. Combine
    const csvContent = [headers.join(","), ...rows].join("\n");

    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const printReport = () => {
    window.print();
};
