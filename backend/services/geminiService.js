import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Analyze CV and extract information
export const analyzeCVWithGemini = async (extractedText) => {
  try {
    const prompt = `
Analize ten CV i zwróć odpowiedź w formacie JSON:

${extractedText}

Odpowiedź powinna zawierać:
{
  "fullName": "imię i nazwisko",
  "email": "email",
  "phone": "telefon",
  "location": "lokalizacja",
  "summary": "krótkie podsumowanie",
  "experience": [
    {
      "company": "firma",
      "position": "stanowisko",
      "startDate": "data_początu",
      "endDate": "data_końca",
      "description": "opis",
      "achievements": ["osiągnięcie1", "osiągnięcie2"]
    }
  ],
  "education": [
    {
      "school": "szkoła",
      "degree": "stopień",
      "field": "kierunek",
      "graduationYear": "rok"
    }
  ],
  "skills": ["umiejętność1", "umiejętność2"],
  "languages": ["język1", "język2"],
  "certifications": ["certyfikat1"],
  "projects": [
    {
      "title": "tytuł",
      "description": "opis",
      "technologies": ["tech1", "tech2"],
      "link": "link"
    }
  ]
}
    `;

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    const responseText = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini CV Analysis Error:', error);
    throw error;
  }
};

// Generate ATS Score
export const generateATSScore = async (cvText, jobDescription) => {
  try {
    const prompt = `
Porównaj to CV z opisem stanowiska i oceń je:

CV:
${cvText}

Opis stanowiska:
${jobDescription}

Zwróć odpowiedź w JSON:
{
  "atsScore": number (0-100),
  "strengths": ["siła1", "siła2", "siła3"],
  "weaknesses": ["słabość1", "słabość2"],
  "recommendations": ["rekomendacja1", "rekomendacja2"],
  "matchPercentage": number (0-100),
  "missingSkills": ["umiejętność1", "umiejętność2"]
}
    `;

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    const responseText = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('ATS Score Generation Error:', error);
    throw error;
  }
};

// Generate personalized CV feedback
export const generatePersonalizedAdvice = async (cvData) => {
  try {
    const prompt = `
Biorąc pod uwagę to CV:
${JSON.stringify(cvData, null, 2)}

Zgeneruj personalizowane rady do poprawy CV w kontekście znalezienia pracy.
Zwróć odpowiedź w formacie JSON:
{
  "overallAdvice": "ogólne porady",
  "improvementAreas": [
    {
      "area": "obszar",
      "issue": "problem",
      "suggestion": "sugestia"
    }
  ],
  "suggestedSkillsToAdd": ["umiejętność1", "umiejętność2"],
  "careerPathSuggestion": "sugerowana ścieżka kariery",
  "industryTrends": "trendy branżowe na jakie warto zwrócić uwagę"
}
    `;

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    const responseText = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Personalized Advice Generation Error:', error);
    throw error;
  }
};
