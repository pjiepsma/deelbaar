import * as FileSystem from 'expo-file-system';

interface BookDetection {
  id: string;
  title: string;
  author?: string;
  confidence: number;
  category?: string;
}

class AIService {
  private googleVisionApiKey?: string;
  private awsRegion?: string;
  private awsAccessKey?: string;
  private awsSecretKey?: string;

  constructor() {
    // ========== AI SERVICE CONFIGURATION ==========
    //
    // Kies één van de twee services voor boek herkenning:
    //
    // 📊 AWS REKOGNITION (AANBEVOLEN - 5000 gratis requests/maand)
    // 1. Ga naar: https://console.aws.amazon.com/iam/
    // 2. Users → Create user → Geef naam "deelbaar-ai"
    // 3. Attach policy: AmazonRekognitionReadOnlyAccess
    // 4. Security credentials → Create access key
    // 5. Vul in: .env bestand maken met:
    //    EXPO_PUBLIC_AWS_REGION=us-east-1
    //    EXPO_PUBLIC_AWS_ACCESS_KEY=je_access_key_id
    //    EXPO_PUBLIC_AWS_SECRET_KEY=je_secret_access_key
    //
    // 🔍 Google Vision AI (1000 gratis requests/maand)
    // 1. Ga naar: https://console.cloud.google.com/
    // 2. Maak project aan → Enable Vision AI API
    // 3. Credentials → Create API Key
    // 4. Vul in: EXPO_PUBLIC_GOOGLE_VISION_API_KEY=je_api_key
    //
    // 💰 Kosten na gratis tier:
    // - AWS Rekognition: $0.001 per image
    // - Google Vision: $0.0015 per request
    //
    // ================================================

    this.googleVisionApiKey =
      process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || 'your_google_api_key';
    // Europese regions zijn sneller voor Nederlandse gebruikers:
    // eu-west-1 (Ireland) - Dichtstbij, goede performance
    // eu-central-1 (Frankfurt) - Nog dichterbij
    // us-east-1 (Virginia) - Standaard, maar verder weg
    this.awsRegion = process.env.EXPO_PUBLIC_AWS_REGION || 'eu-west-1'; // Aanbevolen voor NL
    this.awsAccessKey = process.env.EXPO_PUBLIC_AWS_ACCESS_KEY || 'your_aws_key';
    this.awsSecretKey = process.env.EXPO_PUBLIC_AWS_SECRET_KEY || 'your_aws_secret';
  }

  // Google Vision AI implementatie
  async analyzeWithGoogleVision(imageUri: string): Promise<BookDetection[]> {
    if (!this.googleVisionApiKey) {
      throw new Error('Google Vision API key niet geconfigureerd');
    }

    try {
      // Converteer image naar base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.googleVisionApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 50,
                  },
                  {
                    type: 'DOCUMENT_TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse de resultaten naar boeken
      return this.parseGoogleVisionResults(data);
    } catch (error) {
      console.error('Google Vision error:', error);
      throw error;
    }
  }

  // AWS Rekognition implementatie
  async analyzeWithAWSRekognition(imageUri: string): Promise<BookDetection[]> {
    if (!this.awsRegion || !this.awsAccessKey || !this.awsSecretKey) {
      throw new Error('AWS credentials niet geconfigureerd');
    }

    try {
      // Converteer image naar base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Voor AWS Rekognition hebben we een signature nodig
      const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
      const date = datetime.substr(0, 8);

      // Simpele implementatie - in productie gebruik aws-sdk
      const response = await fetch(`https://rekognition.${this.awsRegion}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'RekognitionService.DetectText',
          'X-Amz-Date': datetime,
          // Authorization headers zouden hier moeten komen
        },
        body: JSON.stringify({
          Image: {
            Bytes: base64Image,
          },
          Filters: {
            WordFilter: {
              MinConfidence: 80,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AWS Rekognition API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAWSRekognitionResults(data);
    } catch (error) {
      console.error('AWS Rekognition error:', error);
      throw error;
    }
  }

  private parseGoogleVisionResults(data: any): BookDetection[] {
    const detections: BookDetection[] = [];
    const textAnnotations = data.responses?.[0]?.textAnnotations || [];

    // Eenvoudige parsing - in productie veel complexer algoritme nodig
    for (let i = 1; i < Math.min(textAnnotations.length, 10); i++) {
      // Skip eerste (hele tekst)
      const annotation = textAnnotations[i];
      const text = annotation.description?.trim();

      if (text && text.length > 3) {
        // Simpele detectie of het een boek titel lijkt
        if (this.looksLikeBookTitle(text)) {
          detections.push({
            id: `google_${i}`,
            title: text,
            confidence: annotation.confidence || 0.5,
            category: this.guessBookCategory(text),
          });
        }
      }
    }

    return detections;
  }

  private parseAWSRekognitionResults(data: any): BookDetection[] {
    const detections: BookDetection[] = [];
    const textDetections = data.TextDetections || [];

    for (const detection of textDetections) {
      if (detection.Type === 'LINE' && detection.Confidence > 70) {
        const text = detection.DetectedText?.trim();

        if (text && this.looksLikeBookTitle(text)) {
          detections.push({
            id: `aws_${detection.Id}`,
            title: text,
            confidence: detection.Confidence / 100,
            category: this.guessBookCategory(text),
          });
        }
      }
    }

    return detections;
  }

  private looksLikeBookTitle(text: string): boolean {
    // Simpele heuristics om te bepalen of tekst een boek titel zou kunnen zijn
    const titleIndicators = [
      text.length > 5 && text.length < 100,
      /^[A-Z]/.test(text), // Start met hoofdletter
      !/\d{4}/.test(text), // Geen jaartal (waarschijnlijk)
      !/@/.test(text), // Geen email
      !/http/.test(text), // Geen URL
    ];

    return titleIndicators.filter(Boolean).length >= 3;
  }

  private guessBookCategory(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('handleiding') || lowerTitle.includes('gids')) return 'Handleiding';
    if (lowerTitle.includes('roman') || lowerTitle.includes('verhaal')) return 'Literatuur';
    if (lowerTitle.includes('wetenschap') || lowerTitle.includes('onderzoek')) return 'Wetenschap';
    if (lowerTitle.includes('geschiedenis') || lowerTitle.includes('historie'))
      return 'Geschiedenis';
    if (lowerTitle.includes('kinder') || lowerTitle.includes('jeugd')) return 'Kinderboeken';

    return 'Onbekend';
  }

  // Hoofdfunctie om te kiezen welke service te gebruiken
  async analyzeBookshelf(
    imageUri: string,
    service: 'google' | 'aws' = 'google'
  ): Promise<BookDetection[]> {
    switch (service) {
      case 'google':
        return this.analyzeWithGoogleVision(imageUri);
      case 'aws':
        return this.analyzeWithAWSRekognition(imageUri);
      default:
        throw new Error('Onbekende AI service');
    }
  }
}

export const aiService = new AIService();
export type { BookDetection };
