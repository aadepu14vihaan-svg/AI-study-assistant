import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Server-side Gemini AI Client with telemetry header
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// 1. AI Study Assistant Endpoint
app.post('/api/ai/study-assistant', async (req, res) => {
  try {
    const { 
      message, 
      grade, 
      board, 
      subject, 
      chapter, 
      language, 
      mode, // 'short_revision' | 'detailed' | 'exam_prep'
      weakTopics 
    } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        reply: `[Demo Mode / Offline]: As a ${grade || 'Class 10'} (${board || 'CBSE'}) study assistant in ${language || 'English'}, here is a student-friendly explanation for "${subject || 'Science'} - ${chapter || 'General'}": \n\n• **Core Concept**: Break complex mechanisms into simple everyday analogies.\n• **Key Rule**: Remember step-by-step problem solving.\n• **Check Understanding**: Can you state the primary definition in your own words?\n\n*(Connect your Gemini API key in AI Studio Secrets to unlock dynamic real-time AI responses.)*`,
      });
    }

    const systemInstruction = `You are an expert, encouraging school teacher and personalized academic tutor for a student in ${grade || 'Class 10'}, studying under the ${board || 'CBSE'} education board.
Language preference: ${language || 'English'}.
Subject: ${subject || 'General'}.
Chapter/Topic: ${chapter || 'General'}.
Mode: ${mode || 'detailed'}.
${weakTopics?.length ? `The student recently struggled with these concepts: ${weakTopics.join(', ')}. Gently reinforce these areas.` : ''}

Guidelines:
1. Explain in simple, clear, student-friendly language matched strictly to ${grade || 'Class 10'} curriculum level.
2. If language is Hindi/Telugu/Tamil/etc., explain in that language or bilingual Hinglish where helpful.
3. For math/science, give step-by-step worked examples, real-life analogies, and formula breakdowns.
4. If in 'short_revision' mode: provide crisp bullet points, key definitions, and quick memory tricks.
5. If in 'exam_prep' mode: highlight frequently asked board exam questions, common mistakes, and step marking tips.
6. Always end with 1 quick check-for-understanding question for the student.
7. Do not claim an answer is directly from a textbook unless quoting official public syllabi (e.g. NCERT).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ reply: response.text });
  } catch (error: unknown) {
    console.error('Study Assistant API error:', error);
    const msg = error instanceof Error ? error.message : 'AI service unavailable';
    return res.status(500).json({ error: msg });
  }
});

// 2. AI Notes Generator Endpoint
app.post('/api/ai/generate-notes', async (req, res) => {
  try {
    const {
      grade,
      board,
      subject,
      chapter,
      noteLength, // 'quick_revision' | 'standard' | 'detailed'
      customContext,
      language
    } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        notes: {
          chapterOverview: `Comprehensive academic overview of ${chapter} for ${grade} (${board}).`,
          importantConcepts: [
            { title: 'Fundamental Principle', explanation: 'Core scientific/mathematical foundation underlying this chapter.' },
            { title: 'Mechanism & Cause', explanation: 'Step-by-step breakdown of how this process operates.' }
          ],
          definitions: [
            { term: 'Standard Definition', definition: 'The official textbook formulation specified in the curriculum.' }
          ],
          keyPoints: [
            'Crucial prerequisite concepts',
            'Primary classification categories',
            'Real-world applications'
          ],
          formulasAndDiagrams: [
            { label: 'Standard Formula', description: 'Formula = Value × Constant (with SI units)' }
          ],
          examples: [
            { title: 'Standard Illustration', problem: 'Sample problem statement', solution: 'Step-by-step solved walkthrough' }
          ],
          commonMistakes: [
            'Confusing unit conversions',
            'Skipping intermediate steps'
          ],
          revisionQuestions: [
            'What is the fundamental difference between the primary classifications?',
            'Solve a 3-mark board question on this mechanism.'
          ],
          quickSummary: `Key takeaway summary for ${chapter}: Focus on core definitions, formulas, and diagrams.`
        }
      });
    }

    const prompt = `Generate comprehensive, structured revision notes for:
Grade: ${grade}
Board: ${board}
Subject: ${subject}
Chapter/Topic: ${chapter}
Target Note Length: ${noteLength || 'standard'}
Language: ${language || 'English'}
${customContext ? `Student provided reference text / syllabus excerpt:\n"""${customContext}"""` : ''}

Return a valid JSON object matching this exact structure:
{
  "chapterOverview": "2-3 sentences introducing the chapter and its weight in exams",
  "importantConcepts": [
    { "title": "Concept Name", "explanation": "Clear student-friendly explanation with analogies" }
  ],
  "definitions": [
    { "term": "Key Term", "definition": "Precise textbook definition" }
  ],
  "keyPoints": [
    "Key revision bullet point 1",
    "Key revision bullet point 2"
  ],
  "formulasAndDiagrams": [
    { "label": "Formula or Diagram Name", "description": "Formula expression with SI units, or text description of diagram labeled parts" }
  ],
  "examples": [
    { "title": "Worked Example Title", "problem": "Question text", "solution": "Step by step solution" }
  ],
  "commonMistakes": [
    "Common student mistake 1 and how to avoid it",
    "Common student mistake 2"
  ],
  "revisionQuestions": [
    "High-probability exam question 1",
    "High-probability exam question 2"
  ],
  "quickSummary": "A concise 3-4 sentence rapid revision wrap-up"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ notes: parsed });
  } catch (error: unknown) {
    console.error('Generate Notes API error:', error);
    const msg = error instanceof Error ? error.message : 'Notes generation failed';
    return res.status(500).json({ error: msg });
  }
});

// 3. AI Quiz Generator Endpoint
app.post('/api/ai/generate-quiz', async (req, res) => {
  try {
    const {
      grade,
      board,
      subject,
      chapter,
      difficulty, // 'easy' | 'medium' | 'hard' | 'mixed'
      numQuestions, // e.g. 5, 10
      questionType, // 'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'mixed'
      language,
      studyContext
    } = req.body;

    const count = Number(numQuestions) || 5;
    const ai = getAiClient();

    if (!ai) {
      // High quality fallback questions
      const fallbackQuestions = [
        {
          id: 'q1',
          question: `Which of the following is the fundamental law governing ${chapter || subject}?`,
          type: 'mcq',
          options: [
            'Conservation of Energy / Matter',
            'Law of Absolute Inertia',
            'Principle of Independent Flux',
            'None of the above'
          ],
          correctAnswer: 'Conservation of Energy / Matter',
          explanation: `In ${subject || 'Science'}, conservation principles form the fundamental framework for this chapter.`,
          topic: `${chapter} Fundamentals`
        },
        {
          id: 'q2',
          question: `State whether the primary reaction/process in ${chapter || subject} is reversible under standard ambient conditions.`,
          type: 'true_false',
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: 'Under standard conditions, these reactions proceed irreversibly toward thermodynamic equilibrium.',
          topic: 'Equilibrium & Conditions'
        },
        {
          id: 'q3',
          question: `The SI unit associated with the primary variable in ${chapter || subject} is _______?`,
          type: 'fill_blank',
          correctAnswer: 'Joule',
          explanation: 'Standard metric units require Joule (or Newton/meter depending on parameter dimension).',
          topic: 'Units & Dimensions'
        },
        {
          id: 'q4',
          question: `Explain why temperature influences the rate of this process in ${chapter || subject}.`,
          type: 'short_answer',
          correctAnswer: 'Higher temperature increases kinetic energy, leading to more frequent effective collisions.',
          explanation: 'Kinetic molecular theory states collision frequency is proportional to average kinetic energy.',
          rubric: 'Full marks: Mentions kinetic energy AND effective collision frequency. Half marks: Mentions only temperature increase.',
          topic: 'Mechanism & Kinetics'
        },
        {
          id: 'q5',
          question: `Which experimental variable must remain constant to verify the theoretical model in ${chapter || subject}?`,
          type: 'mcq',
          options: [
            'Atmospheric Pressure',
            'Ambient Temperature',
            'Concentration of Reactants',
            'All of the above'
          ],
          correctAnswer: 'All of the above',
          explanation: 'To isolate the dependent variable, all environmental and baseline factors must be strictly controlled.',
          topic: 'Experimental Verification'
        }
      ].slice(0, count);

      return res.json({ questions: fallbackQuestions });
    }

    const prompt = `Create an academic quiz test for a student:
Grade: ${grade || 'Class 10'}
Board: ${board || 'CBSE'}
Subject: ${subject}
Chapter: ${chapter}
Difficulty: ${difficulty || 'mixed'}
Number of Questions: ${count}
Question Format: ${questionType || 'mixed'}
Language: ${language || 'English'}
${studyContext ? `Based on this recently studied material:\n"""${studyContext}"""` : ''}

Generate exactly ${count} questions. Return a JSON array of question objects matching this structure:
[
  {
    "id": "q1",
    "question": "Clear question text appropriate for ${grade}",
    "type": "mcq" | "true_false" | "fill_blank" | "short_answer",
    "options": ["Option A", "Option B", "Option C", "Option D"], // only for mcq or true_false
    "correctAnswer": "Exact correct answer string",
    "explanation": "Clear explanation of why this answer is correct and why other options are wrong",
    "rubric": "For short_answer: criteria for full vs partial credit",
    "topic": "Subtopic or concept tested"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.json({ questions: parsed });
  } catch (error: unknown) {
    console.error('Generate Quiz API error:', error);
    const msg = error instanceof Error ? error.message : 'Quiz generation failed';
    return res.status(500).json({ error: msg });
  }
});

// 4. Personalized Study Planner Endpoint
app.post('/api/ai/study-planner', async (req, res) => {
  try {
    const {
      grade,
      board,
      subjects,
      assignments,
      weakTopics,
      upcomingExams,
      dailyStudyHours
    } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        plan: [
          {
            day: 'Today',
            tasks: [
              { time: '04:30 - 05:30 PM', subject: subjects?.[0] || 'Mathematics', topic: 'Priority Homework & Problem Solving', reason: 'Due in less than 24 hours', priority: 'high' },
              { time: '05:45 - 06:30 PM', subject: subjects?.[1] || 'Science', topic: 'Concept Revision & Notes Reading', reason: 'Strengthen core definitions', priority: 'medium' },
              { time: '07:00 - 07:30 PM', subject: 'General Practice', topic: 'Quiz Check & Flashcard Review', reason: 'Consolidate active retention', priority: 'low' },
            ]
          }
        ]
      });
    }

    const prompt = `You are a personalized academic learning planner for a student:
Grade: ${grade || 'Class 10'} (${board || 'CBSE'})
Subjects: ${JSON.stringify(subjects || [])}
Current Pending Assignments: ${JSON.stringify(assignments || [])}
Weak Topics needing revision: ${JSON.stringify(weakTopics || [])}
Upcoming Exams/Goals: ${JSON.stringify(upcomingExams || [])}
Target Daily Study Hours: ${dailyStudyHours || 2.5}

Create a realistic, non-overlapping personalized study plan for the next 3 days that prioritizes imminent deadlines, breaks large assignments into manageable chunks, and reserves revision slots for weak topics.

Return valid JSON:
{
  "plan": [
    {
      "day": "Day Name (e.g. Today / Tomorrow / Wednesday)",
      "date": "YYYY-MM-DD",
      "tasks": [
        {
          "time": "e.g. 04:30 - 05:30 PM",
          "subject": "Subject Name",
          "topic": "Specific topic or assignment",
          "taskType": "homework" | "revision" | "quiz_prep" | "exam_prep",
          "priority": "urgent" | "high" | "medium" | "low",
          "reason": "Why this session was scheduled at this time"
        }
      ]
    }
  ],
  "recommendations": [
    "Helpful strategic tip for this week's exam load"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: unknown) {
    console.error('Study Planner API error:', error);
    const msg = error instanceof Error ? error.message : 'Planner failed';
    return res.status(500).json({ error: msg });
  }
});

// 5. ElevenLabs StudyMate Voice & Text Assistant Endpoint
app.post('/api/studymate/chat', async (req, res) => {
  try {
    const { 
      message, 
      grade, 
      board, 
      language, 
      mode // 'general' | 'quiz' | 'homework_help'
    } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(200).json({
        reply: `Hello! I'm StudyMate, your educational study buddy for ${grade || 'Class 10'} (${board || 'CBSE'}). I'm here to explain concepts simply, help guide your homework step-by-step, or quiz you one question at a time in ${language || 'English'}. How can we tackle your study session today?`
      });
    }

    const systemInstruction = `You are StudyMate, a friendly, warm, and patient educational voice study assistant for a school student.
Student Grade: ${grade || 'Class 10'}.
Education Board: ${board || 'CBSE'}.
Preferred Learning Language: ${language || 'English'}.
Assistant Mode: ${mode || 'general'}.

StudyMate Guidelines:
1. Speak in a natural, friendly, conversational voice tone suitable for voice speech synthesis and reading aloud.
2. Explain concepts strictly calibrated to the student's grade level (${grade || 'Class 10'}). Use simple everyday analogies.
3. If in 'quiz' mode or asked to test the student, ASK EXACTLY ONE QUESTION AT A TIME. Keep questions concise and give constructive, encouraging feedback once answered.
4. Help with homework by guiding the student step-by-step and explaining the 'why' behind formulas rather than just dumping final answers.
5. Adapt phrasing to the student's preferred language (${language || 'English'}).
6. Be completely honest when you don't know a fact or when a topic is outside standard curricula.
7. PRIVACY SAFEGUARD: Never claim to read or modify private student database records, personal files, passwords, or Supabase tables.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    return res.json({ reply: response.text });
  } catch (error: unknown) {
    console.error('StudyMate API error:', error);
    const msg = error instanceof Error ? error.message : 'StudyMate unavailable';
    return res.status(500).json({ error: msg });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
