import { useThemeCustomization } from '@/hooks/use-theme-customization';

interface AnimatedBackgroundProps {
  className?: string;
  opacity?: 'light' | 'medium' | 'strong';
}

export default function AnimatedBackground({ 
  className = "", 
  opacity = 'medium' 
}: AnimatedBackgroundProps) {
  const { getThemeGradients } = useThemeCustomization();
  const overlayOpacity = {
    light: 'bg-background/60 dark:bg-background/65',
    medium: 'bg-background/70 dark:bg-background/75',
    strong: 'bg-background/80 dark:bg-background/85'
  };

  const gradients = getThemeGradients();

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Base gradient background with dynamic movement - using theme gradients */}
      <div 
        className="absolute inset-0 animate-gradient-wave" 
        style={{ background: gradients.background }}
      ></div>
      <div 
        className="absolute inset-0 animate-gradient-shift opacity-60" 
        style={{ background: gradients.hero }}
      ></div>
      
      {/* Large morphing background elements - using theme chat gradient */}
      <div 
        className="absolute -top-1/2 -left-1/2 w-[150%] h-[150%] opacity-30 animate-gradient-morph"
        style={{ background: gradients.chat }}
      ></div>
      <div 
        className="absolute -bottom-1/2 -right-1/2 w-[150%] h-[150%] opacity-25 animate-gradient-pulse" 
        style={{animationDelay: '3s', background: gradients.hero}}
      ></div>
      
      {/* Enhanced floating gradient orbs with new animations - using theme colors */}
      <div 
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl animate-floating-orb opacity-40"
        style={{ background: gradients.background }}
      ></div>
      <div 
        className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full blur-3xl animate-gradient-wave opacity-35" 
        style={{animationDelay: '2s', background: gradients.chat}}
      ></div>
      <div 
        className="absolute bottom-0 left-1/4 w-[450px] h-[450px] rounded-full blur-3xl animate-gradient-shift opacity-38" 
        style={{animationDelay: '4s', background: gradients.hero}}
      ></div>
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-2xl animate-gradient-pulse opacity-30" 
        style={{animationDelay: '1s', background: gradients.background}}
      ></div>
      
      {/* Additional dynamic orbs with enhanced movement - using theme colors */}
      <div 
        className="absolute top-3/4 right-1/4 w-[350px] h-[350px] rounded-full blur-2xl animate-floating-orb opacity-25" 
        style={{animationDelay: '6s', background: gradients.chat}}
      ></div>
      <div 
        className="absolute top-1/4 left-3/4 w-[320px] h-[320px] rounded-full blur-3xl animate-gradient-morph opacity-27" 
        style={{animationDelay: '1s', background: gradients.hero}}
      ></div>
      <div 
        className="absolute bottom-1/3 right-1/3 w-[380px] h-[380px] rounded-full blur-3xl animate-gradient-wave opacity-28" 
        style={{animationDelay: '8s', background: gradients.background}}
      ></div>
      <div 
        className="absolute top-2/3 left-1/6 w-[280px] h-[280px] rounded-full blur-2xl animate-gradient-shift opacity-25" 
        style={{animationDelay: '5s', background: gradients.chat}}
      ></div>
      
      {/* Smaller accent orbs for extra movement - using theme colors */}
      <div 
        className="absolute top-1/6 right-2/3 w-[200px] h-[200px] rounded-full blur-xl animate-floating-orb opacity-20" 
        style={{animationDelay: '3s', background: gradients.hero}}
      ></div>
      <div 
        className="absolute bottom-1/6 left-2/3 w-[180px] h-[180px] rounded-full blur-xl animate-gradient-pulse opacity-22" 
        style={{animationDelay: '7s', background: gradients.background}}
      ></div>
      
      {/* Overlay to maintain readability */}
      <div className={`absolute inset-0 ${overlayOpacity[opacity]}`}></div>
    </div>
  );
}