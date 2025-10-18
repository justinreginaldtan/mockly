// Mock data for development and testing

export const mockInterviewQuestions = [
  {
    id: 1,
    type: "behavioral",
    question: "Tell me about a time when you had to work with a difficult team member.",
    focusArea: "teamwork",
    expectedDuration: 90,
  },
  {
    id: 2,
    type: "behavioral",
    question: "How do you prioritize tasks when you have multiple deadlines?",
    focusArea: "timeManagement",
    expectedDuration: 60,
  },
  {
    id: 3,
    type: "technical",
    question: "Describe a situation where you had to learn a new technology quickly.",
    focusArea: "adaptability",
    expectedDuration: 90,
  },
  {
    id: 4,
    type: "behavioral",
    question: "What's your approach to handling constructive criticism?",
    focusArea: "adaptability",
    expectedDuration: 60,
  },
  {
    id: 5,
    type: "technical",
    question: "Tell me about a project you're particularly proud of and why.",
    focusArea: "leadership",
    expectedDuration: 120,
  },
  {
    id: 6,
    type: "technical",
    question: "How do you stay updated with the latest industry trends?",
    focusArea: "general",
    expectedDuration: 60,
  },
]

export const mockJobDescription = {
  title: "Senior Frontend Engineer",
  company: "Tech Corp",
  requirements: [
    "5+ years of experience with React and TypeScript",
    "Strong leadership and mentoring skills",
    "Experience with agile methodologies",
    "Excellent communication and collaboration abilities",
    "Track record of delivering high-quality products",
  ],
  skills: ["React", "TypeScript", "Leadership", "Agile", "Communication"],
}

export const mockResume = {
  name: "John Doe",
  experience: [
    {
      title: "Frontend Engineer",
      company: "Previous Company",
      duration: "2020-2024",
      highlights: ["Led team of 5 engineers", "Improved performance by 40%", "Implemented CI/CD pipeline"],
    },
  ],
  skills: ["React", "TypeScript", "Node.js", "AWS"],
}

export const mockEvaluationResults = {
  jdCoverage: {
    hit: 65,
    partial: 25,
    miss: 10,
  },
  evidenceSnippets: [
    {
      type: "hit" as const,
      skill: "Team Leadership",
      quote: "I led a cross-functional team of 8 engineers to deliver the project 2 weeks ahead of schedule...",
      matchedRequirement: "Strong leadership and mentoring skills",
    },
    {
      type: "partial" as const,
      skill: "Conflict Resolution",
      quote: "When disagreements arose, I facilitated open discussions to find common ground...",
      matchedRequirement: "Excellent communication and collaboration abilities",
    },
    {
      type: "hit" as const,
      skill: "Technical Expertise",
      quote: "I implemented a microservices architecture using Docker and Kubernetes...",
      matchedRequirement: "5+ years of experience with React and TypeScript",
    },
  ],
  upgradeLines: [
    "Add more specific metrics when discussing project outcomes (e.g., '30% performance improvement')",
    "Elaborate on your role in team decisions - use 'I' statements to highlight your contributions",
    "Include more examples of handling ambiguity and adapting to changing requirements",
  ],
  weakAreas: ["Conflict Resolution", "Handling Ambiguity"],
  overallScore: 75,
  strengths: ["Technical depth", "Clear communication", "Results-oriented"],
}
