export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async generateImageWithMask(imageBuffer: ArrayBuffer, maskBuffer: ArrayBuffer, prompt: string): Promise<string> {
    try {
      const formData = new FormData();
      
      const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
      const maskBlob = new Blob([maskBuffer], { type: 'image/png' });
      
      formData.append('model', 'gpt-image-1');
      formData.append('image', imageBlob, 'image.png');
      formData.append('mask', maskBlob, 'mask.png');
      formData.append('prompt', prompt);
      formData.append('n', '3');
      formData.append('size', '1024x1024');

      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI Images Edit API error details:', errorData);
        throw new Error(`OpenAI Images Edit API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
    if (data.data && Array.isArray(data.data)) {
      return data.data
        .map((item: any) => item.url)
        .filter((url: string) => !!url);
    }

      throw new Error('No image generated');
    } catch (error) {
      console.error('Error generating image with mask:', error);
      throw error;
    }
  }

  async generateFusedImageFromComposite(userImageBuffer: ArrayBuffer, prompt: string): Promise<(string | ArrayBuffer)[]> {
    try {
      console.log('Starting image generation with:');
      console.log('- User image size:', userImageBuffer.byteLength, 'bytes');
      console.log('- Prompt:', prompt);

      // URL du masque Futardio 1 uniquement
      const maskUrl = "https://pub-630b798efee24fb0a992c8f5fc2a5d1c.r2.dev/FutardioMask1.png";

      // Télécharger le masque
      console.log('Downloading mask image...');
      const maskResponse = await fetch(maskUrl);
      if (!maskResponse.ok) {
        throw new Error(`Failed to download mask image: ${maskResponse.status}`);
      }
      const maskBuffer = await maskResponse.arrayBuffer();
      console.log('- Mask image size:', maskBuffer.byteLength, 'bytes');

      // Créer FormData avec les deux images
      const formData = new FormData();
      
      formData.append('model', 'gpt-image-1');
      formData.append('prompt', prompt);
      formData.append('n', '3'); // Générer 3 images
      
      // Ajouter l'image de l'utilisateur
      const userImageBlob = new Blob([userImageBuffer], { type: 'image/jpeg' });
      formData.append('image[]', userImageBlob, 'user.jpg');
      
      // Ajouter le masque Futardio 1
      const maskImageBlob = new Blob([maskBuffer], { type: 'image/png' });
      formData.append('image[]', maskImageBlob, 'futardio-mask1.png');

      console.log('Sending request to OpenAI images/edits with 2 images total...');

      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.text();
        console.error('gpt-image-1 error details:', errorData);
        throw new Error(`gpt-image-1 error: ${response.status}`);
      }

      const data = await response.json() as any;
      console.log('API response keys:', Object.keys(data));
      console.log('Number of images generated:', data.data?.length || 0);
      
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const results: (string | ArrayBuffer)[] = [];
        
        for (let i = 0; i < data.data.length; i++) {
          const item = data.data[i];
          console.log(`Processing image ${i + 1}, keys:`, Object.keys(item));
          
          // Vérifier si on a une URL directe
          if (item.url) {
            console.log(`Generated image ${i + 1} URL:`, item.url);
            results.push(item.url);
          }
          // Vérifier si on a l'image en base64
          else if (item.b64_json) {
            console.log(`Generated image ${i + 1} in base64 format, converting to ArrayBuffer...`);
            const base64Image = item.b64_json;
            
            // Convertir base64 en ArrayBuffer
            const binaryString = atob(base64Image);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            
            results.push(bytes.buffer);
          }
        }
        
        if (results.length > 0) {
          console.log(`Successfully processed ${results.length} images`);
          return results;
        }
      }

      console.error('No images found in response. Data structure keys:', Object.keys(data));
      throw new Error('No images generated');
    } catch (error) {
      console.error('Error generating fused image:', error);
      throw error;
    }
  }
}