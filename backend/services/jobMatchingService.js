import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Match CV with job listings
export const matchCVWithJobs = async (cvData, jobListings) => {
  try {
    const prompt = `
Mam CV kandydata:
${JSON.stringify(cvData, null, 2)}

I listę ofert pracy:
${JSON.stringify(jobListings, null, 2)}

Dopasuj CV do każdej oferty pracy i zwróć odpowiedź w JSON:
{
  "matches": [
    {
      "jobId": "id_oferty",
      "jobTitle": "stanowisko",
      "company": "firma",
      "matchPercentage": number (0-100),
      "matchReasons": ["powód1", "powód2"],
      "missingRequirements": ["wymóg1"],
      "salaryFitScore": number (0-100),
      "cultureFitScore": number (0-100)
    }
  ],
  "recommendedJobs": [
    {
      "jobId": "id",
      "reason": "dlaczego polecam tę ofertę"
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
    console.error('Job Matching Error:', error);
    throw error;
  }
};

// Generate personalized job recommendations
export const generateJobRecommendations = async (userProfile, userPreferences, availableJobs) => {
  try {
    const prompt = `
Profil użytkownika:
${JSON.stringify(userProfile, null, 2)}

Preferencje:
${JSON.stringify(userPreferences, null, 2)}

Dostępne oferty pracy:
${JSON.stringify(availableJobs, null, 2)}

Zgeneruj spersonalizowane rekomendacje ofert pracy w formacie JSON:
{
  "topRecommendations": [
    {
      "jobId": "id",
      "title": "stanowisko",
      "company": "firma",
      "salary": "widełki pensji",
      "location": "lokalizacja",
      "matchScore": number (0-100),
      "whyThisJob": "dlaczego polecam",
      "growthOpportunities": ["możliwość1", "możliwość2"],
      "skillsToDevelop": ["umiejętność1"]
    }
  ],
  "careerGuidance": "porada dotycząca kariery",
  "nextSteps": ["krok1", "krok2"]
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
    console.error('Job Recommendations Generation Error:', error);
    throw error;
  }
};

// Generate email with job recommendations
export const generatePersonalizedJobEmail = async (candidateName, jobMatches, topRecommendations) => {
  try {
    const prompt = `
Zgeneruj spersonalizowaną wiadomość email dla kandydata ${candidateName} z rekomendacjami ofert pracy.

Dopasowan\ne oferty:
${JSON.stringify(jobMatches, null, 2)}

Główne rekomendacje:
${JSON.stringify(topRecommendations, null, 2)}

Wiadomość email powinna być:
- Profesjonalna i zachęcająca
- Zawierać konkretne rekomendacje
- Motywować do aplikacji
- Zawierać porady dotyczące CV

Zwróć odpowiedź w JSON:
{
  "subject": "temat wiadomości",
  "greeting": "powitanie",
  "introduction": "wstęp",
  "jobRecommendations": "rekomendacje ofert",
  "applicationAdvice": "porady dotyczące aplikacji",
  "closingAdvice": "końcowe porady",
  "signature": "podpis"
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
    console.error('Email Generation Error:', error);
    throw error;
  }
};
