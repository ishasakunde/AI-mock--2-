"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/utils/db';
import { UserAnswer } from '@/utils/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useRouter } from 'next/navigation'; // Correct import from next/navigation
import jsPDF from 'jspdf'; // Import jsPDF
import 'jspdf-autotable'; // Optional for table formatting

function Report({ params }) {
    const [reportData, setReportData] = useState([]);
    const router = useRouter(); // Initialize the router here

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            const result = await db
                .select()
                .from(UserAnswer)
                .where(eq(UserAnswer.mockIdRef, params.interviewId))
                .orderBy(UserAnswer.id);
            setReportData(result);
        } catch (error) {
            console.error("Error fetching report data:", error);
        }
    };

    const renderReport = (report) => {
        try {
            const parsedReport = JSON.parse(report);
            return (
                <ul className='list-disc pl-5'>
                    {Object.entries(parsedReport).map(([skill, details]) => (
                        <li key={skill} className='mb-3'>
                            <strong className='block text-gray-700'>{capitalizeFirstLetter(skill.replace('_', ' '))}:</strong>
                            <p className='text-gray-600'>Rating: {details.rating}/5</p>
                            <p className='text-gray-600'>{details.feedback}</p>
                        </li>
                    ))}
                </ul>
            );
        } catch (error) {
            return <p>Error parsing report.</p>;
        }
    };

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Detailed Interview Report', 14, 22);

        const tableData = reportData.map((item, index) => {
            const parsedReport = JSON.parse(item.report);
            const feedbackEntries = Object.entries(parsedReport).map(([skill, details]) => ({
                question: item.question,
                skill: capitalizeFirstLetter(skill.replace('_', ' ')),
                rating: details.rating,
                feedback: details.feedback,
            }));
            return feedbackEntries;
        }).flat();

        const tableBody = tableData.map((entry, index) => [
            index + 1,
            entry.question,
            entry.skill,
            `${entry.rating}/5`,
            entry.feedback
        ]);

        doc.autoTable({
            startY: 30,
            head: [['#', 'Question', 'Skill', 'Rating', 'Feedback']],
            body: tableBody,
            styles: { fontSize: 10, cellPadding: 3 },
            theme: 'striped',
        });

        doc.save('interview-report.pdf');
    };

    return (
        <div className='p-4 max-w-4xl mx-auto'>
            <h2 className='text-3xl font-bold my-10 p-4 w-full bg-blue-950 rounded-lg text-blue-400'>Detailed Interview Report</h2>
            {reportData.length === 0 ? (
                <p>No reports available for this interview.</p>
            ) : (
                reportData.map((item, index) => (
                    <Collapsible key={index} className='mb-4'>
                        <CollapsibleTrigger className='p-4 bg-gray-100 rounded-md border border-gray-300'>
                            <h3 className='text-lg font-semibold text-gray-800'>
                                Question {index + 1}: {item.question}
                            </h3>
                        </CollapsibleTrigger>
                        <CollapsibleContent className='p-4 bg-blue-50 rounded-lg border-t border-gray-300'>
                            {item.report ? renderReport(item.report) : 'No report available.'}
                        </CollapsibleContent>
                    </Collapsible>
                ))
            )}

            <div className='flex justify-end mt-5 gap-4'>
                <Button onClick={handleDownloadPDF}>Download PDF Report</Button> {/* Use the defined function */}
                <Button onClick={() => router.replace('/dashboard')}>Visit Dashboard Page</Button>
                <Button onClick={() => router.push(`/dashboard/interview/${params.interviewId}/feedback`)}>
                    View Feedback
                </Button>
            </div>
        </div>
    );
}

export default Report;
