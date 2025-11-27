import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import type { QuestionAnswer, Standard, ChatSession, MCQ, Subject, UnitTest } from '../types';
import { CHAPTERS, TTSVoice } from "../constants";

// FIX: Aligned with coding guidelines by using process.env.API_KEY directly.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set. Please add it to your project settings.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getAnswerPrompt = (topic: string, chapterName: string, standard: Standard, subject: Subject): string => {
  const basePrompt = `You are a friendly ${subject} tutor for ${standard} students in India.
For the chapter titled "${chapterName}", provide a simple and brief explanation in clear, simple English for the topic: "${topic}".`;

  let instructions = `

CRITICAL INSTRUCTIONS:
- THE ENTIRE RESPONSE MUST BE IN ENGLISH.
- Use Markdown for all formatting.
- Use bold for any subheadings (e.g., **Key Features**).
- Ensure paragraphs are separated by a double newline ('\n\n') for clear visual spacing.
- Explain the concept clearly in 2 to 3 short paragraphs.
- Keep the language simple and easy to understand.
- The entire response should be a single string.`;

  if (subject === 'Computer Science') {
    instructions += `
- For topics that are about programming syntax, data structures, or specific code, ALWAYS include a small, clear, and simple code example. Use Markdown for code blocks (e.g., \`\`\`python\n# your code here\n\`\`\`).
- For purely theoretical topics, do NOT include code examples.`;
  } else if (subject === 'Biology') {
    instructions += `
- Where appropriate, describe biological processes step-by-step.
- If the topic is about a structure (e.g., a cell, a flower), describe its key parts and their functions.
- Avoid code examples entirely.`;
  }
  
  return `${basePrompt}\n${instructions}`;
};

export async function getChapterTopics(chapterName: string, standard: Standard, subject: Subject, existingTopics: string[] = []): Promise<string[]> {
  const topicSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.STRING,
      description: "A single, concise, important question or topic from the chapter."
    }
  };
  let prompt = `You are a friendly ${subject} tutor for ${standard} students in India. For the chapter "${chapterName}", generate a list of 7 to 10 important and distinct questions that are strictly found within the NCERT syllabus for this chapter. The topics should be concise and phrased as questions.`;

  if (subject === 'Computer Science') {
     prompt += ` For chapters that involve programming concepts (like Python syntax, data structures, or algorithms), ensure a good mix of both theoretical questions and questions about specific code implementation or syntax. For example, for a chapter on 'Functions', you could include 'What is a function?' as well as 'How do you define a function in Python?'.`;
  }

  if (existingTopics.length > 0) {
    prompt += `\n\nAvoid generating questions similar to these already listed:\n- ${existingTopics.join('\n- ')}`;
  }
  
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: topicSchema,
        thinkingConfig: { thinkingBudget: 0 }, // Optimization: Faster for simple list generation
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error fetching chapter topics:", error);
    throw new Error(`Failed to get topics for "${chapterName}".`);
  }
}

export async function getTopicContent(topic: string, chapterName: string, standard: Standard, subject: Subject): Promise<string> {
  const answerSchema = {
    type: Type.OBJECT,
    properties: {
      answer: {
        type: Type.STRING,
        description: "A concise, 2-3 paragraph explanation of the topic, with markdown code blocks for programming topics.",
      },
    },
    required: ["answer"],
  };

  try {
    const prompt = getAnswerPrompt(topic, chapterName, standard, subject);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: answerSchema,
        },
    });
    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    return parsedData.answer;
  } catch(error) {
      console.error(`Error fetching content for topic "${topic}":`, error);
      throw new Error(`Failed to get content for topic: "${topic}".`);
  }
}

export async function getRealWorldExampleForTopic(topic: string, subject: Subject, standard: Standard, chapterName: string): Promise<string> {
    const exampleSchema = {
        type: Type.OBJECT,
        properties: {
            example: {
                type: Type.STRING,
                description: "A relatable, real-world example of the topic, explained simply in 1-2 paragraphs.",
            },
        },
        required: ["example"],
    };

    const prompt = `You are an expert at making complex topics relatable for ${standard} ${subject} students in India.
For the topic "${topic}" from the chapter "${chapterName}", provide a simple, concise, and engaging real-world example or usage.

CRITICAL INSTRUCTIONS:
- THE RESPONSE MUST BE IN ENGLISH.
- Keep the explanation to 1 or 2 short paragraphs.
- Use a practical example that a student would encounter in everyday life.
- For Computer Science, you might relate a concept to social media apps, video games, or online shopping.
- For Biology, you could connect a process to medicine, agriculture, or the environment.
- Use Markdown for formatting if needed (e.g., bolding key terms).
- The entire response must be a single string.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: exampleSchema,
                temperature: 0.5,
            },
        });
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        return parsedData.example;
    } catch (error) {
        console.error(`Error fetching real-world example for topic "${topic}":`, error);
        throw new Error(`Failed to get a real-world example for: "${topic}".`);
    }
}


export async function getUnitTestForChapter(chapterName: string, subject: Subject, standard: Standard): Promise<UnitTest> {
    const unitTestSchema = {
        type: Type.OBJECT,
        properties: {
            mcqs: {
                type: Type.ARRAY,
                description: "An array of 5 multiple-choice questions.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING }
                    },
                    required: ["question", "options", "correctAnswer"]
                }
            },
            fillInTheBlanks: {
                type: Type.ARRAY,
                description: "An array of 5 fill-in-the-blank questions.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING, description: "The question with a blank, represented by '____'." },
                        answer: { type: Type.STRING, description: "The word or phrase that fills the blank." }
                    },
                    required: ["question", "answer"]
                }
            },
            twoMarkQuestions: {
                type: Type.ARRAY,
                description: "An array of 3 short-answer questions, each worth two marks.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING }
                    },
                    required: ["question"]
                }
            },
            threeMarkQuestions: {
                type: Type.ARRAY,
                description: "An array of 2 medium-answer questions, each worth three marks.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING }
                    },
                    required: ["question"]
                }
            },
            fiveMarkQuestions: {
                type: Type.ARRAY,
                description: "An array of 2 long-answer questions, each worth five marks.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING }
                    },
                    required: ["question"]
                }
            }
        },
        required: ["mcqs", "fillInTheBlanks", "twoMarkQuestions", "threeMarkQuestions", "fiveMarkQuestions"]
    };

    const prompt = `You are an expert question paper setter for ${subject} students in ${standard}. Based on the entire chapter titled "${chapterName}", generate a comprehensive unit test.
    
    CRITICAL INSTRUCTIONS:
    - The test must cover concepts from the entire chapter, not just one topic.
    - The test must be written in English.
    - The test must strictly adhere to the following structure:
    - Exactly 5 multiple-choice questions. Each must have 4 options.
    - Exactly 5 fill-in-the-blank questions. Use '____' to indicate the blank.
    - Exactly 3 short-answer questions (worth 2 marks each).
    - Exactly 2 medium-answer questions (worth 3 marks each).
    - Exactly 2 long-answer questions (worth 5 marks each).
    - All questions must be relevant to the chapter and appropriate for the student's level.
    - Ensure questions cover a range of difficulties, from easy recall to application.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: unitTestSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (!parsedData.mcqs || !parsedData.fillInTheBlanks) {
            throw new Error("Model returned an invalid or incomplete test structure.");
        }

        return parsedData;

    } catch (error) {
        console.error(`Error generating unit test for chapter "${chapterName}":`, error);
        throw new Error(`Failed to generate a unit test for: "${chapterName}". Please try again.`);
    }
}


export async function getVisualPrompt(topic: string, subject: Subject): Promise<string> {
    try {
        const imagePromptSchema = {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: "A descriptive, concise, and visually-focused prompt for an AI image generator." },
            },
            required: ["prompt"],
        };
        
        const promptForGemini = `You are an expert prompt engineer creating prompts for an AI image generator. A student requires a visual aid for the ${subject} topic: "${topic}".
Your task is to write a concise, descriptive prompt that describes the key visual elements of a simple, clear, and scientifically accurate educational diagram for this topic.

CRITICAL INSTRUCTIONS:
- The prompt must be in English.
- Generate ONLY the description of the visual content. Do not include commands like "Generate..." or "Create...".
- The description must be direct, concrete, and easy for an AI to render visually.
- Explicitly mention the key parts that should be clearly labeled in the diagram.
- Focus on the absolute core concept. Avoid excessive detail.
- For Biology, describe structures, organisms, or processes.
  - Example for 'The Human Heart': "A simplified diagram of the four chambers of the human heart, clearly labeling the aorta, pulmonary artery, atria, and ventricles. Use blue arrows for deoxygenated blood and red arrows for oxygenated."
- For Computer Science, use clear visual metaphors.
  - Example for 'Stack Data Structure': "A visual of a stack of plates. An arrow labeled 'Push' adds a plate to the top. Another arrow labeled 'Pop' removes the top plate."
- The output must be a single, descriptive sentence or a short phrase.`;

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptForGemini,
            config: {
                responseMimeType: "application/json",
                responseSchema: imagePromptSchema,
                temperature: 0.2, 
            },
        });
        
        const parsedData = JSON.parse(geminiResponse.text.trim());
        // Return only the core prompt as requested.
        return parsedData.prompt;

    } catch (error) {
        console.error("Error generating visual prompt:", error);
        throw new Error("Failed to create a visualization prompt. Please try again.");
    }
}

export async function getMCQsForTopic(topic: string, subject: Subject): Promise<MCQ[]> {
    const mcqSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: {
                    type: Type.STRING,
                    description: "The multiple-choice question."
                },
                options: {
                    type: Type.ARRAY,
                    description: "An array of 4 strings representing the possible answers.",
                    items: { type: Type.STRING }
                },
                correctAnswer: {
                    type: Type.STRING,
                    description: "The correct answer, which must be one of the strings from the 'options' array."
                }
            },
            required: ["question", "options", "correctAnswer"]
        }
    };

    try {
        const prompt = `Based on the following ${subject} topic: "${topic}", generate exactly 4 distinct multiple-choice questions (MCQs) to test a student's understanding. Each question must have 4 options, and one of them must be the correct answer. The questions must be in English. Ensure the questions are relevant and cover key aspects of the topic.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: mcqSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            throw new Error("Model returned an invalid or empty array for MCQs.");
        }

        return parsedData;

    } catch (error) {
        console.error(`Error generating MCQs for topic "${topic}":`, error);
        throw new Error(`Failed to generate a quiz for: "${topic}". Please try again.`);
    }
}

export async function generateSpeechFromScript(script: string, voiceName: TTSVoice): Promise<string> {
    try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("The API did not return any audio data.");
        }
        return base64Audio;
    } catch (error) {
        console.error(`Error generating speech with voice "${voiceName}":`, error);
        throw new Error(`Failed to generate audio. The voice model might be temporarily unavailable.`);
    }
}

export async function generateAudioSummary(textToSummarize: string, voiceName: TTSVoice): Promise<string> {
    // Step 1: Generate a concise summary of the text.
    const summarySchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "A concise summary of the provided text in 1-2 simple sentences, suitable for audio playback." },
        },
        required: ["summary"],
    };

    const summaryPrompt = `Summarize the following text into one or two simple sentences. The summary will be used for a quick audio narration for a student. Keep it clear and concise.
    
    Text to summarize:
    ---
    ${textToSummarize}
    ---`;

    let summaryText = "";
    try {
        const summaryResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: summaryPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: summarySchema,
                temperature: 0.3,
            },
        });
        const parsedSummary = JSON.parse(summaryResponse.text.trim());
        summaryText = parsedSummary.summary;
    } catch(error) {
        console.error("Error generating summary for audio, using fallback.", error);
        // Fallback: If summary generation fails, use the first two sentences of the original text.
        summaryText = textToSummarize.split('.').slice(0, 2).join('.').trim() + '.';
        // Ensure the fallback isn't too long if the sentences are very long.
        if (summaryText.length > 400) {
            summaryText = summaryText.substring(0, 400) + '...';
        }
    }
    
    // Step 2: Generate speech from the summarized text.
    return await generateSpeechFromScript(summaryText, voiceName);
}

export function startChatSession(standard: Standard, subject: Subject, chapter?: string): ChatSession {
    let systemInstruction = `You are an expert ${subject} tutor for students in India, following the NCERT syllabus for "${standard}". Your responses must always be in English.`;

    if (chapter) {
        systemInstruction += ` The user is currently studying the chapter "${chapter}". Answer their questions clearly, concisely, and directly related to this chapter. Use simple language and code examples where helpful.`;
    } else {
        systemInstruction += ` The user has not selected a chapter yet. When answering their questions, you MUST mention which chapter the topic belongs to. For example, if they ask about 'sorting algorithms', you should start your response with something like, "Of course! Sorting algorithms are covered in the 'Sorting' chapter. Here's an explanation of Bubble Sort...". This helps the user know where to find the information.`;
    }

    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
    return chat;
}

export async function continueChatStream(chat: ChatSession, message: string) {
    try {
        return chat.sendMessageStream({ message });
    } catch (error) {
        console.error("Error starting chat stream:", error);
        throw new Error("Could not start a streaming chat session. Please try again.");
    }
}