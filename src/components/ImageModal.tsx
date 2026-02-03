import { useState } from 'react';
import { X, Share2 } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(imageUrl);
    const text = 'Mira esta imagen';

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text}%20${encodedUrl}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${text}&body=${text}:%20${imageUrl}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(imageUrl);
        alert('Enlace copiado al portapapeles');
        break;
      case 'native':
        if (navigator.share) {
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'imagen.jpg', { type: 'image/jpeg' });
            await navigator.share({
              files: [file],
              title: 'Compartir imagen',
            });
          } catch (err) {
            console.error('Error sharing:', err);
          }
        }
        break;
    }
    setShowShareMenu(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between sticky top-0 bg-white p-4 border-b">
          <h2 className="text-xl font-semibold text-slate-800">Imagen</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                title="Compartir"
              >
                <Share2 className="w-6 h-6 text-blue-600" />
              </button>
              {showShareMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-50 border-b text-sm text-slate-700"
                  >
                    Compartir por WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-50 border-b text-sm text-slate-700"
                  >
                    Compartir por Email
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-50 border-b text-sm text-slate-700"
                  >
                    Copiar enlace
                  </button>
                  {navigator.share && (
                    <button
                      onClick={() => handleShare('native')}
                      className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
                    >
                      Compartir en otra app
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <img src={imageUrl} alt="Ampliada" className="w-full h-auto rounded-lg" />
        </div>
      </div>
    </div>
  );
}
