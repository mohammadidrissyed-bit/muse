import { STANDARDS, SUBJECTS } from './constants';
import type { Chat } from '@google/genai';

export interface QuestionAnswer {
  question: string;
  answerSteps: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export type Subject = (typeof SUBJECTS)[number];
export type Standard = (typeof STANDARDS)[number];
export type ChatSession = Chat;

export interface VoiceSettings {
  voiceURI: string | null;
  rate: number;
  pitch: number;
}

interface LoadingState<T> {
    isLoading: boolean;
    data?: T;
    error?: string;
}

export interface MCQ {
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface FillInTheBlank {
    question: string;
    answer: string;
}

export interface ShortAnswerQuestion {
    question:string;
}

export interface UnitTest {
    mcqs: MCQ[];
    fillInTheBlanks: FillInTheBlank[];
    twoMarkQuestions: ShortAnswerQuestion[];
    threeMarkQuestions: ShortAnswerQuestion[];
    fiveMarkQuestions: ShortAnswerQuestion[];
}

export type ActiveContentView = 'answer' | 'visualize' | 'mcqs' | 'realWorldExample';

export interface TopicContent {
    question: string;
    answer?: LoadingState<string>;
    visualPrompt?: LoadingState<string>; 
    mcqs?: LoadingState<MCQ[]>;
    realWorldExample?: LoadingState<string>;
    explanationAudio?: LoadingState<string>; // base64 audio string
}