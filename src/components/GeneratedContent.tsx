import React, { useState, PropsWithChildren, useEffect, useRef, useCallback } from 'react';
import type { MCQ, TopicContent, UnitTest, FillInTheBlank, ShortAnswerQuestion } from '../types';
import { ErrorMessage } from './ErrorMessage';

// --- AUDIO DECODING HELPERS ---
// Decodes a base64 string into a Uint8Array.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Converts raw PCM audio data from the Gemini API into an AudioBuffer that can be played.
async function decodeRawAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The raw data is 16-bit PCM, so we create a Int16Array view on the buffer.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the 16-bit integer samples to the float range [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- UI ICONS ---
const PlayIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const PauseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const LoadingIcon = () => ( <div className="w-6 h-6 border-2 border-slate-400 dark:border-slate-500 border-t-blue-500 rounded-full animate-spin"></div> );
const ClipboardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>);
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.847 6.062l-1.011 3.697 3.82-1.004zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.521.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
);


// --- INTERNAL COMPONENTS ---

/**
 * A lightweight parser that converts a markdown string into React elements.
 * Handles paragraphs, bold (**text**), and italics (*text*).
 */
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    // Split content into paragraphs based on double newlines.
    const paragraphs = content.split('\n\n');

    return (
        <>
            {paragraphs.map((p, pIndex) => {
                // Regex to split by bold or italic markers, keeping the markers.
                const parts = p.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);

                return (
                    <p key={pIndex}>
                        {parts.map((part, partIndex) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                    <strong key={partIndex} className="font-bold text-blue-600 dark:text-blue-400">
                                        {part.slice(2, -2)}
                                    </strong>
                                );
                            }
                            if (part.startsWith('*') && part.endsWith('*')) {
                                return <em key={partIndex}>{part.slice(1, -1)}</em>;
                            }
                            // Handle single newlines within a paragraph as line breaks.
                            const lineBrokenParts = part.split('\n').map((line, lineIndex, arr) => (
                                <React.Fragment key={lineIndex}>
                                    {line}
                                    {lineIndex < arr.length - 1 && <br />}
                                </React.Fragment>
                            ));
                            return lineBrokenParts;
                        })}
                    </p>
                );
            })}
        </>
    );
};


const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [isCopied, setIsCopied] = useState(false);
    const codeContent = code.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(codeContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [codeContent]);

    return (
        <div className="not-prose bg-slate-800 dark:bg-black/50 text-white rounded-lg border border-slate-700 my-4 transition-colors duration-300">
            <div className="flex justify-between items-center px-4 py-1.5 bg-slate-900/50 rounded-t-lg border-b border-slate-700">
                <span className="text-xs font-sans text-slate-400">Python</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                    {isCopied ? <CheckIcon /> : <ClipboardIcon />} {isCopied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="text-slate-200 p-4 text-sm overflow-x-auto font-mono whitespace-pre-wrap">
                <code>{codeContent}</code>
            </pre>
        </div>
    );
};

const AudioPlayer = ({ audioB64 }: { audioB64: string }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        let isMounted = true;
        const initAudio = async () => {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const decodedBytes = decode(audioB64);
                const buffer = await decodeRawAudioData(decodedBytes, audioContextRef.current, 24000, 1);
                if (isMounted) {
                    audioBufferRef.current = buffer;
                    setIsReady(true);
                }
            } catch (error) {
                console.error("Failed to decode audio data:", error);
            }
        };
        initAudio();
        return () => { isMounted = false; };
    }, [audioB64]);
    
    const togglePlayback = () => {
        if (!isReady || !audioBufferRef.current || !audioContextRef.current) return;

        if (isPlaying) {
            sourceNodeRef.current?.stop();
            setIsPlaying(false);
        } else {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBufferRef.current;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsPlaying(false);
            source.start(0);
            sourceNodeRef.current = source;
            setIsPlaying(true);
        }
    };
    
    return (
         <button onClick={togglePlayback} disabled={!isReady} className="flex items-center gap-2 text-sm font-semibold p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-wait">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
    );
};

const MCQViewer = ({ mcqs }: { mcqs: MCQ[] }) => {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    
    const handleAnswerSelect = (questionIndex: number, option: string) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: option }));
        if (showResults) setShowResults(false);
    };

    const handleCheckAnswers = () => setShowResults(true);
    const score = showResults ? mcqs.reduce((acc, mcq, index) => (userAnswers[index] === mcq.correctAnswer ? acc + 1 : acc), 0) : 0;

    return (
        <div className="space-y-6">
            {mcqs.map((mcq, index) => {
                const selectedAnswer = userAnswers[index];
                return (
                    <div key={index}>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-3">{index + 1}. {mcq.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mcq.options.map((option) => {
                                const isSelected = selectedAnswer === option;
                                const isCorrect = showResults && mcq.correctAnswer === option;
                                const isIncorrect = showResults && isSelected && !isCorrect;

                                let optionClass = 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent';
                                if (showResults) {
                                    if (isCorrect) optionClass = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-500';
                                    else if (isIncorrect) optionClass = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-500';
                                    else optionClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent';
                                } else if (isSelected) {
                                    optionClass = 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-500';
                                }

                                return (
                                    <button key={option} onClick={() => handleAnswerSelect(index, option)} disabled={showResults} className={`w-full text-left p-2.5 text-sm rounded-md transition-colors border ${showResults ? 'cursor-default' : ''} ${optionClass}`}>
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
             <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-4">
                 {showResults && <span className="text-lg font-bold text-blue-600 dark:text-blue-400">Score: {score}/{mcqs.length}</span>}
                 <button 
                    onClick={showResults ? () => { setShowResults(false); setUserAnswers({}); } : handleCheckAnswers} 
                    disabled={!showResults && Object.keys(userAnswers).length !== mcqs.length} 
                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
                 >
                    {showResults ? 'Try Again' : 'Check Answers'}
                 </button>
            </div>
        </div>
    );
};

const FillInTheBlanksViewer = ({ questions }: { questions: FillInTheBlank[] }) => {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    
    const handleInputChange = (index: number, value: string) => {
        setAnswers(prev => ({ ...prev, [index]: value }));
        if (showResults) setShowResults(false);
    };

    return (
        <div className="space-y-4">
             {questions.map((q, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex-shrink-0">{i + 1}. {q.question.split('____')[0]}</p>
                    <input 
                        type="text"
                        value={answers[i] || ''}
                        onChange={(e) => handleInputChange(i, e.target.value)}
                        className={`text-sm p-1 rounded-md border text-center w-32 ${showResults ? (answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim() ? 'bg-green-100 dark:bg-green-900/50 border-green-500' : 'bg-red-100 dark:bg-red-900/50 border-red-500') : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
                    />
                    <p className="text-sm text-slate-700 dark:text-slate-300">{q.question.split('____')[1]}</p>
                    {showResults && answers[i]?.toLowerCase().trim() !== q.answer.toLowerCase().trim() && (
                        <p className="text-xs text-green-600 dark:text-green-400 sm:ml-2">(Ans: {q.answer})</p>
                    )}
                </div>
            ))}
            <div className="flex justify-end mt-4">
                <button onClick={() => setShowResults(!showResults)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 text-sm">
                    {showResults ? 'Hide Answers' : 'Check Answers'}
                </button>
            </div>
        </div>
    );
};

const ShortAnswerViewer = ({ questions, title }: { questions: ShortAnswerQuestion[], title: string }) => (
    <div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{title}</h4>
        <ul className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {questions.map((q, i) => <li key={i}>{q.question}</li>)}
        </ul>
    </div>
);


// --- MAIN EXPORTED COMPONENTS ---

const GeneratedCard = ({ title, children, shareText }: PropsWithChildren<{ title: string, shareText?: string }>) => {
    const handleShare = useCallback(() => {
        if (shareText) {
            const encodedText = encodeURIComponent(shareText);
            window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
        }
    }, [shareText]);

    return (
        <div className="glass-panel bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 sm:p-6 animate-fade-in border border-black/5 dark:border-white/5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                {shareText && (
                    <button onClick={handleShare} className="flex items-center gap-1.5 text-xs font-semibold p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" aria-label="Share on WhatsApp">
                        <WhatsAppIcon />
                    </button>
                )}
            </div>
            {children}
        </div>
    );
};

export const AnswerCard = ({ title, content, audioState, onGenerateAudio }: { title: string; content: string; audioState?: TopicContent['explanationAudio']; onGenerateAudio?: () => void; }) => {
    // Split the content by markdown code blocks, keeping the code blocks
    const parts = content.split(/(```[\s\S]*?```)/g).filter(part => part.trim() !== '');

    return (
        <GeneratedCard title={title} shareText={`Check out this explanation from QuliQaT:\n\n${content}`}>
            {onGenerateAudio && (
                <div className="flex items-center gap-4 mb-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                     <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Audio Summary:</p>
                    {
                        audioState?.isLoading ? <LoadingIcon /> :
                        audioState?.error ? <span className="text-xs text-red-500">Error</span> :
                        audioState?.data ? <AudioPlayer audioB64={audioState.data} /> :
                        <button onClick={onGenerateAudio} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">Generate</button>
                    }
                </div>
            )}
            <div className="prose prose-sm max-w-none text-justify text-slate-600 dark:text-slate-300 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:text-slate-700 dark:prose-headings:text-slate-200">
                {parts.map((part, index) => {
                    if (part.startsWith('```')) {
                        return <CodeBlock key={index} code={part} />;
                    } else {
                        return <MarkdownContent key={index} content={part} />;
                    }
                })}
            </div>
        </GeneratedCard>
    );
};

export const VisualizationCard = ({ title, topic, promptState }: { title: string; topic: string; promptState: TopicContent['visualPrompt']; }) => {
    const [editedPrompt, setEditedPrompt] = useState(promptState?.data || '');
    const [copiedButton, setCopiedButton] = useState<'gemini' | 'meta' | null>(null);

    useEffect(() => {
        if (promptState?.data) {
            setEditedPrompt(promptState.data);
        }
    }, [promptState?.data]);
    
    const handleCopyAndOpen = useCallback((platform: 'gemini' | 'meta') => {
        if (!editedPrompt) return;

        if (platform === 'gemini') {
            navigator.clipboard.writeText(editedPrompt).then(() => {
                setCopiedButton('gemini');
                const timer = setTimeout(() => setCopiedButton(null), 2500);

                const url = `https://gemini.google.com/app?prompt=${encodeURIComponent(editedPrompt)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
                
                return () => clearTimeout(timer);
            }).catch(err => {
                console.error('Failed to copy prompt for Gemini:', err);
                // Fallback: still open the URL even if copy fails
                const url = `https://gemini.google.com/app?prompt=${encodeURIComponent(editedPrompt)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            });
        } else { // platform === 'meta'
            setCopiedButton('meta');
            const timer = setTimeout(() => setCopiedButton(null), 2500);
            
            // Per user's example, use the official Meta AI bot phone number
            // and prepend the prompt with the `/imagine` command.
            const metaAiPhoneNumber = '13135550002';
            const promptText = `/imagine ${editedPrompt}`;
            const encodedPrompt = encodeURIComponent(promptText);
            const url = `https://wa.me/${metaAiPhoneNumber}?text=${encodedPrompt}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            
            // Must return the timeout cleanup function
            return () => clearTimeout(timer);
        }
    }, [editedPrompt]);
    
    return (
         <GeneratedCard title="Concept Visualization Prompt">
            {promptState?.error && <ErrorMessage message={promptState.error} />}
            {promptState?.data && (
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Edit the prompt below and use it with an AI image generator to create a visual representation of the concept.</p>
                    <textarea
                        value={editedPrompt}
                        onChange={(e) => setEditedPrompt(e.target.value)}
                        rows={6}
                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 resize-y"
                        aria-label="Concept visualization prompt"
                    />
                    <div className="flex flex-col gap-3">
                         <button
                            onClick={() => handleCopyAndOpen('gemini')}
                            disabled={copiedButton !== null}
                            className="w-full text-center font-semibold py-3 px-4 rounded-lg bg-cyan-400 text-slate-900 hover:bg-cyan-500 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:ring-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {copiedButton === 'gemini' ? 'Copied & Opening...' : 'Generate with Gemini'}
                        </button>
                        <div>
                            <button
                                onClick={() => handleCopyAndOpen('meta')}
                                disabled={copiedButton !== null}
                                className="w-full text-center font-semibold py-3 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:ring-green-600 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {copiedButton === 'meta' ? 'Copied & Opening...' : 'Visualize with Meta AI'}
                            </button>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">Opens Meta AI chat in WhatsApp.</p>
                        </div>
                    </div>
                </div>
            )}
        </GeneratedCard>
    );
};


export const QuizCard = ({ title, mcqs }: { title: string; mcqs: MCQ[]; }) => (
    <GeneratedCard title={title}>
        <MCQViewer mcqs={mcqs} />
    </GeneratedCard>
);

export const UnitTestCard = ({ title, unitTest }: { title: string; unitTest: UnitTest; }) => (
    <div className="space-y-6">
        <GeneratedCard title="Multiple Choice Questions">
            <MCQViewer mcqs={unitTest.mcqs} />
        </GeneratedCard>
        <GeneratedCard title="Fill in the Blanks">
            <FillInTheBlanksViewer questions={unitTest.fillInTheBlanks} />
        </GeneratedCard>
        <GeneratedCard title="Short & Long Answer Questions">
            <div className="space-y-4">
                <ShortAnswerViewer questions={unitTest.twoMarkQuestions} title="2-Mark Questions" />
                <ShortAnswerViewer questions={unitTest.threeMarkQuestions} title="3-Mark Questions" />
                <ShortAnswerViewer questions={unitTest.fiveMarkQuestions} title="5-Mark Questions" />
            </div>
        </GeneratedCard>
    </div>
);