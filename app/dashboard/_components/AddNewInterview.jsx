"use client"
import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { chatSession } from '@/utils/GeminiAIModel';
import { LoaderCircle } from 'lucide-react';
import { db } from '@/utils/db';
import { MockInterview } from '@/utils/schema';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';
import { useRouter } from 'next/navigation';

function AddNewInterview() {
    const [openDialog, setOpenDialog] = useState(false);
    const [jobPosition, setJobPosition] = useState('');
    const [jobDesc, setJobDesc] = useState('');
    const [jobExperience, setJobExperience] = useState('');
    const [loading, setLoading] = useState(false);
    const [jsonResponse, setJsonResponse] = useState([]);
    const router = useRouter();
    const { user } = useUser();

    const onSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        console.log(jobPosition, jobDesc, jobExperience);

        const InputPrompt = `Job Position: ${jobPosition}, Job Descriptions: ${jobDesc}, Years of Experience: ${jobExperience}. Based on this information, please give me ${process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT} interview questions with answers in JSON format. Provide 'Question' and 'Answer' fields in JSON.`;

        try {
            const result = await chatSession.sendMessage(InputPrompt);

            // Sanitize the AI response: remove Markdown-like formatting or problematic characters
            let MockJsonResp = (await result.response.text())
                .replace(/```json|```/g, '') // Remove ```json and ```
                .replace(/[\n\r\t]/g, ''); // Remove newlines, carriage returns, tabs

            console.log("Sanitized JSON:", MockJsonResp); // Log sanitized string

            // Parse the sanitized JSON response
            const parsedResponse = JSON.parse(MockJsonResp);
            console.log("Parsed JSON:", parsedResponse);
            setJsonResponse(parsedResponse);

            const resp = await db.insert(MockInterview)
                .values({
                    mockId: uuidv4(),
                    jsonMockResp: MockJsonResp, // Save sanitized response
                    jobPosition: jobPosition,
                    jobDesc: jobDesc,
                    jobExperience: jobExperience,
                    createdBy: user?.primaryEmailAddress?.emailAddress,
                    createdAt: moment().format('DD-MM-yyyy')
                })
                .returning({ mockId: MockInterview.mockId });

            console.log("Inserted ID:", resp);

            if (resp) {
                setOpenDialog(false);
                router.push('/dashboard/interview/' + resp[0]?.mockId);
            }
        } catch (error) {
            console.error("Error during JSON processing:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className='p-10 border rounded-lg bg-secondary hover:scale-105
            hover:shadow-md cursor-pointer'
                onClick={() => setOpenDialog(true)}
            >
                <h2 className='font-bold text-lg text-center'>+ Add New</h2>
            </div>
            <Dialog open={openDialog}>
                <DialogContent className="max-w-2xl" >
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Tell us more about your job interviewing</DialogTitle>
                        <DialogDescription>
                            <form onSubmit={onSubmit}>
                                <div>
                                    <h2>Add details about your job position/role, job description, and years of experience</h2>
                                    <div className='mt-7 my-3'>
                                        <label>Job Role/Job Position</label>
                                        <Input
                                            placeholder="Ex. Full Stack Developer"
                                            required
                                            onChange={(event) => setJobPosition(event.target.value)}
                                        />
                                    </div>

                                    <div className=' my-3'>
                                        <label>Job Description/ Tech Stack</label>
                                        <Textarea
                                            placeholder="Ex.React, Nodejs"
                                            required
                                            onChange={(event) => setJobDesc(event.target.value)}
                                        />
                                    </div>

                                    <div className='mt-7 my-3'>
                                        <label>Years of Experience</label>
                                        <Input
                                            placeholder="Ex. 5" type="number" max="20"
                                            required
                                            onChange={(event) => setJobExperience(event.target.value)}
                                        />
                                    </div>

                                </div>
                                <div className='flex gap-5 justify-end'>
                                    <Button type="button" variant="ghost" onClick={() => setOpenDialog(false)}>Cancel</Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ?
                                            <>
                                                <LoaderCircle className='animate-spin' /> Generating From AI
                                            </>
                                            : 'Start Interview'}
                                    </Button>
                                </div>
                            </form>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

        </div>
    )
}

export default AddNewInterview;


// "use client"
// import React, { useState } from 'react'
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
//   } from "@/components/ui/dialog"
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { chatSession } from '@/utils/GeminiAIModel';
// import { LoaderCircle } from 'lucide-react';
// import { db } from '@/utils/db';
// import { MockInterview } from '@/utils/schema';
// import { v4 as uuidv4 } from 'uuid';
// import { useUser } from '@clerk/nextjs';
// import moment from 'moment';
// import { useRouter } from 'next/navigation';
  
// function AddNewInterview() {
//     const [openDialog, setOpenDialog] = useState(false);
//     const [jobPosition, setJobPosition] = useState('');
//     const [jobDesc, setJobDesc] = useState('');
//     const [jobExperience, setJobExperience] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [jsonResponse,setJsonResponse] = useState([]);
//     const router = useRouter();
//     const {user} = useUser();

//     const onSubmit=async(e)=>{
//         setLoading(true)
//         e.preventDefault()
//         console.log(jobPosition,jobDesc,jobExperience)

//         const InputPrompt="Job Position : "+jobPosition+" , Job Descriptions : "+jobDesc+", Years of Experience : "+jobExperience+", Depends on this information please give me "+process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT+"Interview questions with Answered in Json Format, Give Question and Answered as field in JSON"
        
//         const result=await chatSession.sendMessage(InputPrompt);
//         const MockJsonResp=(result.response.text()).replace('```json','').replace('```','')

//         console.log(JSON.parse(MockJsonResp));
//         setJsonResponse(MockJsonResp);

//         const resp=await db.insert(MockInterview)
//         .values({
//             mockId:uuidv4(),
//             jsonMockResp:MockJsonResp,
//             jobPosition:jobPosition,
//             jobDesc:jobDesc,
//             jobExperience:jobExperience,
//             createdBy:user?.primaryEmailAddress?.emailAddress,
//             createdAt:moment().format('DD-MM-yyyy')
//         }).returning({mockId:MockInterview.mockId});

//         console.log("Inserted ID:",resp)
//         if(resp){
//             setOpenDialog(false);
//             router.push('/dashboard/interview/'+resp[0]?.mockId)
//         }

//         setLoading(false);
//     }
//   return (
//     <div>
//         <div className='p-10 border rounded-lg bg-secondary hover:scale-105
//         hover:shadow-md cursor-pointer'
//         onClick={()=>setOpenDialog(true)}
//         >
//             <h2 className='font-bold text-lg text-center'>+ Add New</h2>
//         </div>
//         <Dialog open={openDialog}>
//         <DialogContent className="max-w-2xl" >
//             <DialogHeader>
//             <DialogTitle className="text-2xl">Tell us more about your job interviewing</DialogTitle>
//             <DialogDescription>
//                 <form onSubmit={onSubmit}>
//                 <div>
//                     <h2>Add details about your job position/role, job description, and years of experience</h2>
//                     <div className='mt-7 my-3'>
//                               <label>Job Role/Job Position</label>
//                               <Input
//                                  placeholder="Ex. Full Stack Developer"
//                                  required
//                                  onChange={(event) => setJobPosition(event.target.value)}
//                                  />
//                     </div> 

//                     <div className=' my-3'>
//                               <label>Job Description/ Tech Stak</label>
//                               <Textarea
//                                  placeholder="Ex.React, Nodejs"
//                                  required
//                                  onChange={(event) => setJobDesc(event.target.value)}
//                                 />
//                     </div> 

//                     <div className='mt-7 my-3'>
//                               <label>Years of Expierence</label>
//                               <Input
//                                  placeholder="Ex. 5" type="number" max="20"
//                                  required
//                                  onChange={(event) => setJobExperience(event.target.value)}
//                                  />
//                     </div> 

//                 </div>
//                 <div className='flex gap-5 justify-end'>
//                     <Button type="button" variant="ghost" onClick={()=>setOpenDialog(false)}>Cancel</Button>
//                     <Button type="submit" diasable={loading}>
//                         {loading?
//                         <>
//                         <LoaderCircle className='animate-spin'/>'Generating From AI'
//                         </> :'Start Interview'
//                         }
//                         </Button>
//                 </div>
//                 </form>r
//             </DialogDescription>
//             </DialogHeader>
//         </DialogContent>
//         </Dialog> 

//     </div>
//   )
// }

// export default AddNewInterview