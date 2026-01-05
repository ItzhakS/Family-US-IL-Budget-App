import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseReceiptImage = async (base64Image: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `Analyze this receipt image. Extract the following details in JSON format:
            - date (YYYY-MM-DD format)
            - totalAmount (number)
            - merchant (string)
            - currency (Detect currency code: 'ILS' for Shekels/NIS, 'USD' for Dollars)
            - category (Suggest a category from: Cat 1, Cat 2, Housing, Food & Dining, Transportation, Utilities, Ma'aser, Education, Tax, Savings, Other)
            
            Return ONLY the JSON object.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
            currency: { type: Type.STRING }
          }
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
};

export const getSpendingInsights = async (transactions: Transaction[], userQuery: string): Promise<string> => {
  try {
    // We only send a simplified version of transactions to save tokens
    const simplifiedData = transactions.map(t => `${t.date}: ${t.description} (${t.category}) - ${t.currency === 'ILS' ? '₪' : '$'}${t.amount} [${t.type}]`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful financial assistant for a family. Here is a list of the user's recent transactions:
      
      ${simplifiedData}
      
      User Question: "${userQuery}"
      
      Please analyze the data and provide a helpful, concise answer. Note that there are two currencies (ILS and USD), do not mix them up in calculations.
      If the user asks for advice, be encouraging but realistic.`
    });

    return response.text || "I couldn't generate an insight at this time.";
  } catch (error) {
    console.error("Error generating insight:", error);
    return "Sorry, I encountered an error while analyzing your data.";
  }
};
