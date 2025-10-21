interface PlayLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
  variant?: 'default' | 'minimal';
}

export default function PlayLogo({ size = 'medium', showText = true, className = '', variant = 'default' }: PlayLogoProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Play Button Icon */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* Background circle - adapts to theme */}
        {variant === 'default' && (
          <div className="absolute inset-0 bg-card dark:bg-card rounded-full border border-border"></div>
        )}
        
        {/* Play triangle with gradient effect */}
        <div 
          className={`absolute ${variant === 'default' ? 'inset-2' : 'inset-1'} rounded-full flex items-center justify-center`}
          style={{
            background: 'linear-gradient(135deg, #ff6b35 0%, #8e44ad 30%, #3498db 60%, #2ecc71 80%, #f1c40f 100%)'
          }}
        >
          {/* Triangle using CSS transform */}
          <div 
            className="w-0 h-0 border-l-white border-y-transparent ml-0.5"
            style={{
              borderLeftWidth: size === 'small' ? '4px' : size === 'large' ? '8px' : '6px',
              borderTopWidth: size === 'small' ? '3px' : size === 'large' ? '6px' : '4px',
              borderBottomWidth: size === 'small' ? '3px' : size === 'large' ? '6px' : '4px'
            }}
          ></div>
        </div>
      </div>
      
      {/* Text - adapts to theme */}
      {showText && (
        <span className={`font-bold text-foreground ${textSizeClasses[size]}`}>
          Play
        </span>
      )}
    </div>
  );
}
