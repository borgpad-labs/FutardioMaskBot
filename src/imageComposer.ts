export class ImageComposer {
  
  // Composer l'image utilisateur avec un masque Futardio
  async composeImageWithMask(userImageBuffer: ArrayBuffer, maskImageUrl: string): Promise<ArrayBuffer> {
    try {
      // Télécharger l'image du masque depuis R2
      const maskResponse = await fetch(maskImageUrl);
      if (!maskResponse.ok) {
        throw new Error(`Failed to fetch mask image: ${maskResponse.status}`);
      }
      const maskBuffer = await maskResponse.arrayBuffer();

      // Créer des ImageData à partir des buffers
      const userImageData = await this.bufferToImageData(userImageBuffer);
      const maskImageData = await this.bufferToImageData(maskBuffer);

      // Composer les deux images
      const composedImageData = this.overlayMaskOnImage(userImageData, maskImageData);

      // Convertir le résultat en buffer
      return this.imageDataToBuffer(composedImageData);
    } catch (error) {
      console.error('Erreur lors de la composition d\'image:', error);
      throw error;
    }
  }

  // Convertir ArrayBuffer en ImageData (simulé pour Cloudflare Workers)
  private async bufferToImageData(buffer: ArrayBuffer): Promise<ImageData> {
    // Dans un environnement Cloudflare Workers, nous devons simuler ImageData
    // car Canvas API n'est pas disponible. On va utiliser une approche différente.
    
    // Pour l'instant, on retourne les données brutes
    // Cette fonction devra être adaptée selon l'API disponible
    return {
      data: new Uint8ClampedArray(buffer),
      width: 512, // Taille par défaut, à ajuster
      height: 512,
      colorSpace: 'srgb' as PredefinedColorSpace
    };
  }

  // Superposer le masque sur l'image utilisateur
  private overlayMaskOnImage(userImage: ImageData, maskImage: ImageData): ImageData {
    // Créer une nouvelle image composite
    const composedData = new Uint8ClampedArray(userImage.data);
    
    // Logique de superposition (simplified alpha blending)
    // Cette fonction devra être développée selon les besoins spécifiques
    
    return {
      data: composedData,
      width: userImage.width,
      height: userImage.height,
      colorSpace: userImage.colorSpace
    };
  }

  // Convertir ImageData en ArrayBuffer
  private imageDataToBuffer(imageData: ImageData): ArrayBuffer {
    // Conversion simplifiée - à améliorer selon le format de sortie souhaité
    return imageData.data.buffer;
  }

  // Approche alternative plus simple : créer un prompt décrivant la composition
  async createCompositionPrompt(userImageBuffer: ArrayBuffer, maskImageUrl: string): Promise<string> {
    // Au lieu de composer réellement les images, on crée un prompt très détaillé
    // qui décrit comment fusionner l'image utilisateur avec le masque
    
    const maskNumber = this.extractMaskNumber(maskImageUrl);
    
    return `Take this person's face and naturally integrate it with the white Futardio mask (reference: mask ${maskNumber}). 
    
FUSION INSTRUCTIONS:
- Keep the person's facial features, expression, and bone structure
- Apply the white Futardio mask as if it's physically worn by the person
- The mask should cover forehead, eye area, and upper cheeks
- Preserve the person's hair, lower face, and overall head shape
- Match the lighting and shadows of the original photo
- Make the mask look like it's actually part of the scene, not digitally added
- Ensure seamless blending at the mask edges
- Maintain photo-realistic quality throughout

The result should look like the person is actually wearing the Futardio mask, not like two separate images combined.`;
  }

  private extractMaskNumber(maskUrl: string): number {
    const match = maskUrl.match(/FutardioMask(\d+)\.png/);
    return match ? parseInt(match[1]) : 1;
  }
}
