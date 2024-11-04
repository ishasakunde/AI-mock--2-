import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import useSpeechToText from 'react-hook-speech-to-text'
import { Mic, StopCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { chatSession } from '@/utils/GeminiAIModel'
import { db } from '@/utils/db'
import { UserAnswer } from '@/utils/schema'
import { useUser } from '@clerk/nextjs'
import moment from 'moment'

function RecordAnswerSection({ mockInterviewQuestion, activeQuestionIndex, interviewData }) {
    const [userAnswer, setUserAnswer] = useState('');
    const { user } = useUser();
    const [loading, setLoading] = useState(false);

    const {
        error,
        interimResult,
        isRecording,
        results,
        startSpeechToText,
        stopSpeechToText,
        setResults
    } = useSpeechToText({
        continuous: true,
        useLegacyResults: false
    });

    // Update the answer text as results accumulate
    useEffect(() => {
        const combinedAnswers = results.map(result => result?.transcript || '').join(' ');
        setUserAnswer(combinedAnswers);
    }, [results]);

    // Automatically submit the answer after recording stops if the answer length is sufficient
    useEffect(() => {
        if (!isRecording && userAnswer.length > 10) {
            handleAnswerSubmission();
        }
    }, [isRecording]);

    const StartStopRecording = () => {
        if (isRecording) stopSpeechToText();
        else startSpeechToText();
    };

    const handleAnswerSubmission = async () => {
        try {
            setLoading(true);
            const feedbackPrompt = `Question: ${mockInterviewQuestion[activeQuestionIndex]?.Question}, User Answer: ${userAnswer}. Please give a rating and feedback in JSON format with fields "rating" and "feedback".`;

            const result = await chatSession.sendMessage(feedbackPrompt);
            const rawResponse = await result.response.text();
            console.log("AI Raw Response:", rawResponse);

            const parsedFeedback = parseJsonResponse(rawResponse);
            if (!parsedFeedback) throw new Error("Invalid JSON format in AI response.");

            await saveAnswerToDB(parsedFeedback);

            toast('User Answer recorded successfully');
            setUserAnswer('');
            setResults([]);
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error processing response or saving to database.");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to extract and parse JSON from AI response
    const parseJsonResponse = (response) => {
        const jsonMatch = response.match(/\{.*?\}/s);
        if (!jsonMatch) return null;
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error("JSON Parsing Error:", error);
            return null;
        }
    };

    // Save the parsed feedback to the database
    const saveAnswerToDB = async (feedback) => {
        const resp = await db.insert(UserAnswer).values({
            mockIdRef: interviewData?.mockId,
            question: mockInterviewQuestion[activeQuestionIndex]?.Question,
            correctAns: mockInterviewQuestion[activeQuestionIndex]?.Answer,
            userAns: userAnswer,
            feedback: feedback?.feedback,
            rating: feedback?.rating,
            userEmail: user?.primaryEmailAddress?.emailAddress,
            createdAt: moment().format('DD-MM-yyyy')
        });
        return resp;
    };

    return (
        <div className='flex items-center justify-center flex-col'>
            <div className='flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5'>
                <Webcam
                    mirrored={true}
                    style={{
                        height: 300,
                        width: '100%',
                        zIndex: 10
                    }}
                />
            </div>
            <Button 
                disabled={loading}
                variant="outline" 
                className='my-10'
                onClick={StartStopRecording}
            >
                {isRecording ?
                    <h2 className='text-red-600 animate-pulse flex gap-2 items-center'>
                        <StopCircle /> Stop Recording
                    </h2>
                    :
                    <h2 className='text-blue-600 flex gap-2 items-center'>
                        <Mic /> Record Answer
                    </h2>
                }
            </Button>

            {/* Loading Spinner */}
            {loading && <Loader2 className="animate-spin w-6 h-6 my-4" />}
            {error && <p className="text-red-500 mt-4">{error.message}</p>}
        </div>
    );
}

export default RecordAnswerSection;


// import { Button } from '@/components/ui/button'
// import Image from 'next/image'
// import React, { useEffect, useState } from 'react'
// import Webcam from 'react-webcam'
// import useSpeechToText from 'react-hook-speech-to-text'
// import { Mic, StopCircle, Loader2 } from 'lucide-react'  // Loader2 for spinner
// import { toast } from 'sonner'
// import { chatSession } from '@/utils/GeminiAIModel'
// import { db } from '@/utils/db'
// import { UserAnswer } from '@/utils/schema'
// import { useUser } from '@clerk/nextjs'
// import moment from 'moment'

// function RecordAnswerSection({mockInterviewQuestion, activeQuestionIndex, interviewData}) {
//     const [userAnswer, setUserAnswer] = useState('');
//     const { user } = useUser();
//     const [loading, setLoading] = useState(false);
//     const {
//         error,
//         interimResult,
//         isRecording,
//         results,
//         startSpeechToText,
//         stopSpeechToText,
//         setResults
//     } = useSpeechToText({
//         continuous: true,
//         useLegacyResults: false
//     });

//     // Combine speech results into a single answer string
//     useEffect(() => {
//         const combinedAnswers = results.map(result => result?.transcript || '').join(' ');
//         setUserAnswer(combinedAnswers);
//     }, [results]);

//     // Automatically submit the answer after recording stops and answer is long enough
//     useEffect(() => {
//         if (!isRecording && userAnswer.length > 10) {
//             UpdateUserAnswer();
//         }
//     }, [isRecording]);

//     const StartStopRecording = async () => {
//         if (isRecording) {
//             stopSpeechToText();
//         } else {
//             startSpeechToText();
//         }
//     };

//     const UpdateUserAnswer = async () => {
//         try {
//             console.log(userAnswer); // Log the user answer to check before processing
//             setLoading(true);
    
//             // Prompt sent to the AI model
//             const feedbackPrompt = `Question: ${mockInterviewQuestion[activeQuestionIndex]?.Question}, 
//                 User Answer: ${userAnswer}, 
//                 Please give a rating and feedback in JSON format with fields "rating" and "feedback in 2-3 lines".`;
    
//             const result = await chatSession.sendMessage(feedbackPrompt);
//             let mockJsonResp = await result.response.text();
    
//             // Log the raw response to understand the format
//             console.log("Raw AI response:", mockJsonResp);
    
//             // Try to extract the JSON part from the response using regex
//             const jsonMatch = mockJsonResp.match(/\{.*?\}/s);
//             if (!jsonMatch) {
//                 throw new Error("No JSON found in AI response.");
//             }
    
//             // Get the JSON string
//             let cleanedJsonResp = jsonMatch[0]; // The first match will be the JSON string
    
//             // Attempt to parse the cleaned JSON
//             let JsonFeedbackResp;
//             try {
//                 JsonFeedbackResp = JSON.parse(cleanedJsonResp);
//             } catch (error) {
//                 console.error("Error parsing JSON:", error);
//                 throw new Error("Invalid JSON format in AI response.");
//             }
    
//             console.log("Parsed JSON response:", JsonFeedbackResp);
    
//             // Proceed to save in the database if parsing is successful
//             const resp = await db.insert(UserAnswer).values({
//                 mockIdRef: interviewData?.mockId,
//                 question: mockInterviewQuestion[activeQuestionIndex]?.Question,
//                 correctAns: mockInterviewQuestion[activeQuestionIndex]?.Answer,
//                 userAns: userAnswer,
//                 feedback: JsonFeedbackResp?.feedback,
//                 rating: JsonFeedbackResp?.rating,
//                 userEmail: user?.primaryEmailAddress?.emailAddress,
//                 createdAt: moment().format('DD-MM-yyyy')
//             });
    
//             if (resp) {
//                 toast('User Answer recorded successfully');
//                 setUserAnswer(''); // Clear the answer
//                 setResults([]); // Clear the results
//             }
    
//         } catch (error) {
//             console.error("Error processing response or saving to database:", error);
//             toast.error("Error processing response or saving to database.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className='flex items-center justify-center flex-col'>
//             <div className='flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5'>
//                 <Webcam
//                     mirrored={true}
//                     style={{
//                         height: 300,
//                         width: '100%',
//                         zIndex: 10
//                     }}
//                 />
//             </div>
//             <Button 
//                 disabled={loading}
//                 variant="outline" 
//                 className='my-10'
//                 onClick={StartStopRecording}
//             >
//                 {isRecording ?
//                     <h2 className='text-red-600 animate-pulse flex gap-2 items-center'>
//                         <StopCircle /> Stop Recording
//                     </h2>
//                     :
//                     <h2 className='text-blue-600 flex gap-2 items-center'>
//                         <Mic /> Record Answer
//                     </h2>
//                 }
//             </Button>

//             {/* Loading Spinner */}
//             {loading && <Loader2 className="animate-spin w-6 h-6 my-4" />}
//         </div>
//     );
// }

// export default RecordAnswerSection;
