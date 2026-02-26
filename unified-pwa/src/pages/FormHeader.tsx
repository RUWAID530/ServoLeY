interface HeaderProps {
  step: number;
  total: number;
}

export default function FormHeader({ step, total }: HeaderProps) {
  const progress = Math.round(((step + 1) / total) * 100);

  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Provider Onboarding
            </h1>
            <p className="text-xs text-gray-500">
              Step {step + 1} of {total}
            </p>
          </div>
          <span className="text-xs font-medium text-indigo-600">
            {progress}% completed
          </span>
        </div>

        <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
