import { ReactNode, useState, useId, cloneElement, isValidElement, ReactElement, Children } from 'react';

interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ children, text, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent';
    }
  };

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  const child = Children.only(children);
  
  let enhancedChild: ReactNode;
  
  if (isValidElement(child)) {
    const childProps = (child as ReactElement).props;
    enhancedChild = cloneElement(child as ReactElement, {
      'aria-describedby': text ? tooltipId : undefined,
      onMouseEnter: (e: React.MouseEvent) => {
        showTooltip();
        if (childProps.onMouseEnter) childProps.onMouseEnter(e);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        hideTooltip();
        if (childProps.onMouseLeave) childProps.onMouseLeave(e);
      },
      onFocus: (e: React.FocusEvent) => {
        showTooltip();
        if (childProps.onFocus) childProps.onFocus(e);
      },
      onBlur: (e: React.FocusEvent) => {
        hideTooltip();
        if (childProps.onBlur) childProps.onBlur(e);
      },
    });
  } else {
    enhancedChild = (
      <span
        tabIndex={0}
        aria-describedby={text ? tooltipId : undefined}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {child}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      {enhancedChild}
      <div 
        id={tooltipId}
        role="tooltip"
        aria-hidden={!isVisible}
        className={`
          absolute z-50 px-3 py-2 text-xs font-medium text-white 
          bg-gray-800 dark:bg-gray-700 rounded-lg shadow-lg
          max-w-xs text-center pointer-events-none
          transition-opacity duration-150
          ${isVisible ? 'opacity-100' : 'opacity-0 invisible'}
          ${getPositionClasses()}
        `}
      >
        {text}
        <div 
          className={`
            absolute w-0 h-0 border-4
            ${getArrowClasses()}
          `}
        />
      </div>
    </div>
  );
}
