import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { TOOLTIPS } from '@/lib/tooltips';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipWrapperProps {
  tooltipKey: keyof typeof TOOLTIPS;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function TooltipWrapper({
  tooltipKey,
  children,
  className,
  showIcon = false,
  side = "top",
  align = "center"
}: TooltipWrapperProps) {
  const tooltip = TOOLTIPS[tooltipKey];
  
  if (!tooltip) {
    console.warn(`Tooltip key "${tooltipKey}" not found`);
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-1", className)}>
            {children}
            {showIcon && <Info className="h-4 w-4 text-muted-foreground" />}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          className="layer-tooltip space-y-3"
        >
          {tooltip.name && <p className="font-medium">{tooltip.name}</p>}
          <div className="space-y-1">
            <p className="font-bold underline">Description</p>
            <p>{tooltip.description}</p>
          </div>
          {tooltip.source && (
            <div className="space-y-1">
              <p className="font-bold underline">Source</p>
              <p>{tooltip.source}</p>
            </div>
          )}
          {tooltip.link && (
            <div className="space-y-1">
              <p className="font-bold underline">Link</p>
              <a 
                href={tooltip.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="url-link text-blue-500 hover:text-blue-600 block"
              >
                {tooltip.link}
              </a>
            </div>
          )}
          {tooltip.additionalInfo && (
            Object.keys(tooltip.additionalInfo).length > 0 && (
              <div className="space-y-1">
                <p className="font-bold underline">Additional Information</p>
                {tooltip.additionalInfo.text && (
                  <p>{tooltip.additionalInfo.text}</p>
                )}
                {tooltip.additionalInfo.links?.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="url-link text-blue-500 hover:text-blue-600 block"
                  >
                    {link.label}
                  </a>
                ))}
                {tooltip.additionalInfo.imageUrl && (
                  <img 
                    src={tooltip.additionalInfo.imageUrl}
                    alt="Additional information"
                    className="max-w-full rounded-md mt-1"
                  />
                )}
              </div>
            )
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 