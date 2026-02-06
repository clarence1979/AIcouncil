import { Loader, Check, Volume2, Upload, Video } from 'lucide-react';
import type { TalkingHeadStatus } from '../lib/talking-head-orchestrator';

interface VideoGenerationProgressProps {
  personaName: string;
  status: TalkingHeadStatus;
}

export function VideoGenerationProgress({
  personaName,
  status,
}: VideoGenerationProgressProps) {
  const steps = [
    { id: 'generating_audio', label: 'Generating voice', icon: Volume2 },
    { id: 'uploading_assets', label: 'Uploading assets', icon: Upload },
    { id: 'generating_video', label: 'Animating video', icon: Video },
    { id: 'completed', label: 'Complete', icon: Check },
  ];

  const getCurrentStepIndex = () => {
    const index = steps.findIndex(step => step.id === status.status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
          {status.status === 'completed' ? (
            <Check className="text-green-400" size={20} />
          ) : (
            <Loader className="text-blue-400 animate-spin" size={20} />
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-blue-100 font-semibold">{personaName}</h4>
          <p className="text-blue-300 text-sm">{status.message}</p>
        </div>
      </div>

      <div className="relative">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <div className="text-xs text-blue-300 text-right mt-1">
          {status.progress}%
        </div>
      </div>

      <div className="flex justify-between mt-4 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <div
              key={step.id}
              className={`flex-1 flex flex-col items-center gap-1 ${
                isComplete
                  ? 'opacity-100'
                  : isCurrent
                  ? 'opacity-100'
                  : 'opacity-40'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isComplete
                    ? 'bg-green-500/20 border-2 border-green-400'
                    : isCurrent
                    ? 'bg-blue-500/20 border-2 border-blue-400 animate-pulse'
                    : 'bg-gray-700/20 border-2 border-gray-600'
                }`}
              >
                {isComplete ? (
                  <Check size={14} className="text-green-400" />
                ) : isCurrent ? (
                  <Icon size={14} className="text-blue-400" />
                ) : (
                  <Icon size={14} className="text-gray-400" />
                )}
              </div>
              <span
                className={`text-[10px] text-center ${
                  isComplete
                    ? 'text-green-300'
                    : isCurrent
                    ? 'text-blue-300'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
