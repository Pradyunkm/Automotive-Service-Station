import { LiveFeed } from './LiveFeed'; // Updated import

interface BrakeShoeInspectionProps {
  onAnalysis: (block: 'front' | 'left' | 'right' | 'brake', result: any) => void;
}

export function BrakeShoeInspection({ onAnalysis }: BrakeShoeInspectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full"></span>
        Brake Shoe Visual Inspection
      </h2>

      <LiveFeed
        title="Brake Shoe Views"
        showUpload
        onAnalysisComplete={(block, result) => {
          // Forward results to parent callback
          onAnalysis(block, result);
        }}
      />
    </div>
  );
}
