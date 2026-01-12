// ============================================
// SERVICE DE COMPRESSION D'IMAGES
// ============================================

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  maxSizeKB?: number;
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  maxSizeKB: 500, // 500KB max
  outputType: 'image/jpeg',
};

export const imageService = {
  // Compresser une image
  async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<{ success: boolean; file?: File; blob?: Blob; error?: string }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve) => {
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        resolve({ success: false, error: 'Le fichier n\'est pas une image' });
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          try {
            // Calculer les nouvelles dimensions
            let { width, height } = img;
            const maxWidth = opts.maxWidth!;
            const maxHeight = opts.maxHeight!;

            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }

            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }

            // Créer le canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve({ success: false, error: 'Impossible de créer le contexte canvas' });
              return;
            }

            // Dessiner l'image redimensionnée
            ctx.drawImage(img, 0, 0, width, height);

            // Fonction pour compresser avec qualité variable
            const compressWithQuality = (quality: number): Promise<Blob | null> => {
              return new Promise((res) => {
                canvas.toBlob(
                  (blob) => res(blob),
                  opts.outputType,
                  quality
                );
              });
            };

            // Compresser progressivement jusqu'à atteindre la taille cible
            const targetSize = opts.maxSizeKB! * 1024;
            let quality = opts.quality!;

            const compress = async (): Promise<Blob | null> => {
              let blob = await compressWithQuality(quality);
              
              // Réduire la qualité si nécessaire
              while (blob && blob.size > targetSize && quality > 0.1) {
                quality -= 0.1;
                blob = await compressWithQuality(quality);
              }

              return blob;
            };

            compress().then((blob) => {
              if (!blob) {
                resolve({ success: false, error: 'Erreur lors de la compression' });
                return;
              }

              // Créer un nouveau fichier
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                { type: opts.outputType }
              );

              resolve({
                success: true,
                file: compressedFile,
                blob,
              });
            });
          } catch (error) {
            resolve({ success: false, error: 'Erreur lors du traitement de l\'image' });
          }
        };

        img.onerror = () => {
          resolve({ success: false, error: 'Impossible de charger l\'image' });
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        resolve({ success: false, error: 'Erreur lors de la lecture du fichier' });
      };

      reader.readAsDataURL(file);
    });
  },

  // Compresser pour photo de profil (petite taille)
  async compressProfilePhoto(file: File): Promise<{ success: boolean; file?: File; error?: string }> {
    return this.compressImage(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.85,
      maxSizeKB: 150,
    });
  },

  // Compresser pour document d'identité (bonne qualité)
  async compressIdentityDocument(file: File): Promise<{ success: boolean; file?: File; error?: string }> {
    return this.compressImage(file, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.9,
      maxSizeKB: 800,
    });
  },

  // Compresser pour preuve de transaction
  async compressTransactionProof(file: File): Promise<{ success: boolean; file?: File; error?: string }> {
    return this.compressImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
      maxSizeKB: 500,
    });
  },

  // Obtenir les dimensions d'une image
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('Impossible de charger l\'image'));
      };
      img.src = URL.createObjectURL(file);
    });
  },

  // Vérifier si le fichier est une image valide
  isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
  },

  // Obtenir la taille formatée
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  // Créer une URL de prévisualisation
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  },

  // Libérer une URL de prévisualisation
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  },
};

export default imageService;
