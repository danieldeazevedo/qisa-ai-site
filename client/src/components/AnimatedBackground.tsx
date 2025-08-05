interface AnimatedBackgroundProps {
  className?: string;
  opacity?: 'light' | 'medium' | 'strong';
}

export default function AnimatedBackground({ 
  className = "", 
  opacity = 'medium' 
}: AnimatedBackgroundProps) {
  const overlayOpacity = {
    light: 'bg-background/60 dark:bg-background/65',
    medium: 'bg-background/70 dark:bg-background/75',
    strong: 'bg-background/80 dark:bg-background/85'
  };

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`} style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.12) 50%, rgba(236, 72, 153, 0.15) 100%)',
      transition: 'none'
    }}>
      {/* Enhanced base gradient background with intense movement */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200/90 via-purple-200/70 to-pink-200/90 dark:from-blue-800/50 dark:via-purple-800/40 dark:to-pink-800/50 animate-gradient-aurora"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-cyan-100/70 via-indigo-100/50 to-rose-100/70 dark:from-cyan-800/40 dark:via-indigo-800/30 dark:to-rose-800/40 animate-gradient-plasma"></div>
      
      {/* Large morphing background elements with new animations */}
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-blue-400/20 via-purple-400/15 to-pink-400/20 dark:from-blue-300/25 dark:via-purple-300/20 dark:to-pink-300/25 animate-gradient-nebula"></div>
      <div className="absolute -bottom-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-to-tl from-indigo-400/18 via-violet-400/12 to-fuchsia-400/18 dark:from-indigo-300/23 dark:via-violet-300/17 dark:to-fuchsia-300/23 animate-gradient-kaleidoscope" style={{animationDelay: '3s'}}></div>
      
      {/* Spiral gradient layers */}
      <div className="absolute top-1/4 left-1/4 w-[150%] h-[150%] bg-gradient-to-r from-emerald-400/15 via-cyan-400/20 to-blue-400/15 animate-gradient-spiral" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-1/4 right-1/4 w-[150%] h-[150%] bg-gradient-to-l from-rose-400/15 via-orange-400/20 to-amber-400/15 animate-gradient-spiral" style={{animationDelay: '5s', animationDirection: 'reverse'}}></div>
      
      {/* Enhanced floating gradient orbs with intense new animations */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-gradient-to-br from-blue-300/35 via-cyan-300/30 to-purple-300/35 rounded-full blur-3xl animate-gradient-aurora"></div>
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-purple-300/33 via-pink-300/27 to-rose-300/35 rounded-full blur-3xl animate-gradient-kaleidoscope" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-0 left-1/4 w-[550px] h-[550px] bg-gradient-to-tr from-pink-300/37 via-rose-300/33 to-blue-300/30 rounded-full blur-3xl animate-gradient-nebula" style={{animationDelay: '4s'}}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-200/25 via-purple-200/30 to-pink-200/25 rounded-full blur-2xl animate-gradient-plasma" style={{animationDelay: '1s'}}></div>
      
      {/* New intense morphing orbs */}
      <div className="absolute top-1/6 right-1/6 w-[450px] h-[450px] bg-gradient-to-bl from-indigo-300/30 via-violet-300/35 to-purple-300/30 rounded-full blur-3xl animate-gradient-spiral" style={{animationDelay: '7s'}}></div>
      <div className="absolute bottom-1/6 left-1/6 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-300/32 via-teal-300/37 to-cyan-300/32 rounded-full blur-3xl animate-gradient-aurora" style={{animationDelay: '3s'}}></div>
      
      {/* Additional dynamic orbs with enhanced movement */}
      <div className="absolute top-3/4 right-1/4 w-[350px] h-[350px] bg-gradient-to-bl from-indigo-400/25 via-cyan-400/20 to-teal-400/25 rounded-full blur-2xl animate-floating-orb" style={{animationDelay: '6s'}}></div>
      <div className="absolute top-1/4 left-3/4 w-[320px] h-[320px] bg-gradient-to-tr from-rose-400/27 via-orange-400/23 to-amber-400/25 rounded-full blur-3xl animate-gradient-morph" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-[380px] h-[380px] bg-gradient-to-bl from-violet-400/23 via-fuchsia-400/28 to-purple-400/25 rounded-full blur-3xl animate-gradient-wave" style={{animationDelay: '8s'}}></div>
      <div className="absolute top-2/3 left-1/6 w-[280px] h-[280px] bg-gradient-to-tr from-emerald-400/20 via-cyan-400/25 to-blue-400/22 rounded-full blur-2xl animate-gradient-shift" style={{animationDelay: '5s'}}></div>
      
      {/* Smaller accent orbs for extra movement */}
      <div className="absolute top-1/6 right-2/3 w-[200px] h-[200px] bg-gradient-to-br from-yellow-400/15 via-orange-400/20 to-red-400/18 rounded-full blur-xl animate-floating-orb" style={{animationDelay: '3s'}}></div>
      <div className="absolute bottom-1/6 left-2/3 w-[180px] h-[180px] bg-gradient-to-tl from-green-400/18 via-teal-400/22 to-cyan-400/20 rounded-full blur-xl animate-gradient-pulse" style={{animationDelay: '7s'}}></div>
      
      {/* Overlay to maintain readability */}
      <div className={`absolute inset-0 ${overlayOpacity[opacity]}`}></div>
    </div>
  );
}