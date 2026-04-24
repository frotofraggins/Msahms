import { cn } from '@/lib/utils';

export interface PathStep {
  id: string;
  label: string;
  href: string;
}

export interface ProgressIndicatorProps {
  steps: PathStep[];
  currentStepId: string;
  completedStepIds: string[];
}

/**
 * Guided decision engine step tracker.
 *
 * Shows completed steps (●), current step (●), remaining steps (○).
 */
export function ProgressIndicator({
  steps,
  currentStepId,
  completedStepIds,
}: ProgressIndicatorProps) {
  const completedSet = new Set(completedStepIds);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((step, i) => {
        const isCompleted = completedSet.has(step.id);
        const isCurrent = step.id === currentStepId;
        const isPast = isCompleted && !isCurrent;

        return (
          <div key={step.id} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  'mx-1 h-0.5 w-4 sm:w-6',
                  isPast || isCompleted ? 'bg-primary' : 'bg-gray-300',
                )}
              />
            )}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  isCompleted
                    ? 'bg-primary text-white'
                    : isCurrent
                      ? 'border-2 border-primary bg-white text-primary'
                      : 'border-2 border-gray-300 bg-white text-gray-400',
                )}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              <span
                className={cn(
                  'mt-1 whitespace-nowrap text-[10px]',
                  isCurrent ? 'font-semibold text-primary' : 'text-text-light',
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
