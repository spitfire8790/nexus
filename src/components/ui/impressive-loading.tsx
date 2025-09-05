import { Loader2 } from "lucide-react";

interface ImpressiveLoadingProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export function ImpressiveLoading({ 
  message = "Loading property data...", 
  showProgress = false, 
  progress = 0 
}: ImpressiveLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 min-h-[400px]">
      {/* Main loading animation */}
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        
        {/* Inner pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Loading message */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{message}</h3>
        <p className="text-sm text-muted-foreground">
          Analyzing property details, zoning information, and spatial data...
        </p>
      </div>

      {/* Progress bar (optional) */}
      {showProgress && (
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Animated dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
}

// Alternative simpler but still impressive loading component
export function SimpleImpressiveLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px]">
      {/* Large spinning loader with gradient */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-transparent border-t-blue-600 border-r-blue-400 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-green-500 border-l-green-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      {/* Message with typing animation */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground mb-2">{message}</h3>
        <div className="flex items-center justify-center space-x-1">
          <span className="text-sm text-muted-foreground">Processing</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
