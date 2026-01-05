import { useState, useEffect } from 'react';
import { X, RefreshCw, Check, Loader } from 'lucide-react';
import { generateAvatarOptions } from '../lib/avatar-generation';
import { getCachedPersonaAvatar } from '../lib/talking-head-orchestrator';

interface AvatarSelectionModalProps {
  personaName: string;
  onSelect: (selectedUrl: string, allUrls: string[]) => void;
  onCancel: () => void;
}

export function AvatarSelectionModal({
  personaName,
  onSelect,
  onCancel,
}: AvatarSelectionModalProps) {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cachedAvatar, setCachedAvatar] = useState<string | null>(null);

  useEffect(() => {
    loadAvatarOptions();
    checkCachedAvatar();
  }, [personaName]);

  const checkCachedAvatar = async () => {
    try {
      const cached = await getCachedPersonaAvatar(personaName);
      setCachedAvatar(cached);
    } catch (err) {
      console.error('Failed to check cached avatar:', err);
    }
  };

  const loadAvatarOptions = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateAvatarOptions(personaName, 3);
      setOptions(result.urls);
      setSelected(result.urls[0]);
    } catch (err) {
      console.error('Avatar generation error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate avatar options. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    loadAvatarOptions();
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected, options);
    }
  };

  const handleUseCached = () => {
    if (cachedAvatar) {
      onSelect(cachedAvatar, [cachedAvatar]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-blue-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-gradient-to-br from-gray-900 to-gray-800 border-b border-blue-500/20 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-100">
              Choose Avatar for {personaName}
            </h2>
            <p className="text-sm text-blue-300 mt-1">
              Select the portrait that best represents {personaName}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-blue-300 hover:text-blue-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-blue-400 animate-spin mb-4" />
              <p className="text-blue-200 text-lg">
                Generating {personaName}'s portraits...
              </p>
              <p className="text-blue-400 text-sm mt-2">
                Using DALL-E 3 to create photorealistic options
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
              <p className="text-red-200 mb-4">{error}</p>
              <button
                onClick={handleRegenerate}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && options.length > 0 && (
            <>
              {cachedAvatar && (
                <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-200 text-sm mb-3">
                    You've used {personaName} before. Would you like to reuse the previous avatar?
                  </p>
                  <div className="flex gap-3 items-center">
                    <img
                      src={cachedAvatar}
                      alt="Previous avatar"
                      className="w-20 h-20 rounded-lg object-cover border-2 border-blue-400"
                    />
                    <button
                      onClick={handleUseCached}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Reuse Previous Avatar
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {options.map((url, index) => (
                  <div
                    key={index}
                    onClick={() => setSelected(url)}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all transform hover:scale-105 ${
                      selected === url
                        ? 'ring-4 ring-blue-500 shadow-xl shadow-blue-500/50'
                        : 'ring-2 ring-blue-500/20 hover:ring-blue-400/50'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${personaName} option ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    {selected === url && (
                      <div className="absolute top-3 right-3 bg-blue-500 rounded-full p-2 shadow-lg">
                        <Check size={20} className="text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-white text-sm font-medium text-center">
                        Option {index + 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && !error && (
          <div className="sticky bottom-0 bg-gradient-to-br from-gray-900 to-gray-800 border-t border-blue-500/20 p-6 flex gap-3">
            <button
              onClick={handleRegenerate}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-blue-100 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Generate New Options
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Confirm Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
