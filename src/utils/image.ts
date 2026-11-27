// Utilitário de redimensionamento de imagem (Canvas API, sem dependências externas)
// Usado para reduzir o tamanho de fotos de avatar antes de salvar como base64.

export interface ResizeImageOptions {
  /** Largura máxima em pixels (padrão: 512) */
  maxWidth?: number;
  /** Altura máxima em pixels (padrão: 512) */
  maxHeight?: number;
  /** Qualidade do JPEG de 0 a 1 (padrão: 0.85) */
  quality?: number;
}

/**
 * Redimensiona uma imagem de arquivo e retorna o base64 (sem o prefixo data:).
 * Mantém a proporção original. Retorna Promise<string> com apenas o base64.
 */
export function resizeImage(
  file: File,
  options: ResizeImageOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const { maxWidth = 512, maxHeight = 512, quality = 0.85 } = options;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.src = dataUrl;

      img.onload = () => {
        // Calcula nova dimensão mantendo a proporção
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar o contexto do canvas'));
          return;
        }

        // drawImage com dimensões alvo faz o redimensionamento
        ctx.drawImage(img, 0, 0, width, height);

        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = resizedDataUrl.split(',')[1] ?? '';
        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error('Não foi possível carregar a imagem'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Não foi possível ler o arquivo da imagem'));
    };
  });
}