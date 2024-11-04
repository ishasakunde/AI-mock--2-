"use client"
import { db } from '@/utils/db'
import { UserAnswer } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import React, { useEffect, useState } from 'react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

function Feedback({ params }) {
    const [feedbackList, setFeedbackList] = useState([]);
    const [overallRating, setOverallRating] = useState(0);
    const router = useRouter();

    useEffect(() => {
        GetFeedback();
    }, []);

    const GetFeedback = async () => {
        const result = await db.select()
            .from(UserAnswer)
            .where(eq(UserAnswer.mockIdRef, params.interviewId))
            .orderBy(UserAnswer.id);

        setFeedbackList(result);
        calculateOverallRating(result);
    };

    const calculateOverallRating = (feedbacks) => {
        if (feedbacks.length === 0) {
            setOverallRating(0);
            return;
        }
    
        // Ensure all feedback ratings are valid numbers
        const totalRating = feedbacks.reduce((sum, feedback) => {
            const rating = parseFloat(feedback.rating) || 0; // Safeguard against invalid numbers
            return sum + rating;
        }, 0);
    
        const averageRating = totalRating / feedbacks.length;
    
        // Limit the overall rating to a range between 0 and 10
        const validAverageRating = Math.min(Math.max(averageRating, 0), 10);
    
        setOverallRating(validAverageRating.toFixed(1)); // Set rounded average rating
    };
    

    return (
        <div >
            {feedbackList?.length === 0 ?
                <h2 className='font-bold text-xl text-gray-400'>No Interview Feedback Found</h2>
                :
                <>
                    <div className='bg-white shadow-md rounded-lg p-8 mb-6 my-7'>
                        <h2 className='text-3xl font-bold text-green-600'>Congratulations!</h2>
                        <h2 className='font-bold text-2xl text-gray-800'>Here is your interview feedback</h2>

                        <div className='my-5'>
                            <h2 className='text-blue-600 text-lg'>
                                Your overall interview rating: <span className='font-semibold text-xl'>{overallRating}</span>/10
                            </h2>
                        </div>
                    </div>

                    {feedbackList && feedbackList.map((item, index) => (
                        <Collapsible key={index} className='mt-7'>
                            <CollapsibleTrigger className='p-4 bg-gray-100 rounded-lg border border-gray-300 flex justify-between items-center'>
                                <span className='font-semibold text-gray-800'>
                                    {item.question}
                                </span>
                                <ChevronsUpDown className='h-5 w-5 text-gray-500' />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className='p-4 bg-white border-t rounded-b-lg shadow-sm'>
                                    <h2 className='text-blue-600 mb-2'><strong>Rating: </strong>{item.rating}</h2>
                                    <h2 className='text-gray-800 mb-2'><strong>Your Answer: </strong>{item.userAns}</h2>
                                    <h2 className='text-green-600 mb-2'><strong>AI Generated Answer: </strong>{item.correctAns}</h2>
                                    <h2 className='text-purple-600'><strong>Feedback: </strong>{item.feedback}</h2>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </>
            }

            <div className='mt-10 flex justify-right'>
               
                <Button onClick={() => router.replace('/dashboard')} className='bg-blue-600 hover:bg-blue-700 text-white'>
                    Visit Dashboard
                </Button>
               
            </div>
        </div>
    );
}

export default Feedback;



// "use client"
// import { db } from '@/utils/db'
// import { UserAnswer } from '@/utils/schema'
// import { eq } from 'drizzle-orm'
// import React, { useEffect,useState} from 'react'
// import { index } from "drizzle-orm/pg-core"

// import {
//     Collapsible,
//     CollapsibleContent,
//     CollapsibleTrigger,
//   } from "@/components/ui/collapsible"

// function Feedback({params}) {
    
//     const [feedbackList,setFeedbackList]=useState([])
//     useEffect(()=>{
//         GetFeedback();
//     },[])

//     const GetFeedback=async()=>{
//         const result=await db.select()
//         .from(UserAnswer)
//         .where(eq(UserAnswer.mockIdRef,params.interviewId))
//         .orderBy(UserAnswer.id)

//         console.log(result);
//         setFeedbackList(result);
//     }

//   return (
//     <div className='p-10'>
//         <h2 className='text-3xl font-bold text-green-500'>Congratulation!</h2>
//         <h2 className='font-bold text-2xl'>Here is your interview feedback</h2>
//         <h2 className='text-blue-500 text-lg my-3'>Your overall interview rating: <strong>7/10</strong></h2>

//         <h2 className='text-sm text-gray-500'>Find below interview question with correct answer, Your answer and feedback for improvement</h2>

//         {feedbackList&&feedbackList.map((item,index)=>(
//             <Collapsible key={index}>
//             <CollapsibleTrigger>
//             {item.question}
//             </CollapsibleTrigger>
//             <CollapsibleContent>
//               Yes. Free to use for personal and commercial projects. No attribution
//               required.
//             </CollapsibleContent>
//           </Collapsible>
//             ))}
//     </div>
//   )
// }

// export default Feedback