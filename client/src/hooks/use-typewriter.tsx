import { useState, useEffect, useRef } from "react";

interface UseTypewriterProps {
  text: string;
  speed?: number;
  lineDelay?: number;
  enabled?: boolean;
  messageId?: string;
}

export function useTypewriter({ 
  text, 
  speed = 15, // Base speed
  lineDelay = 50, // Base line delay
  enabled = true,
  messageId
}: UseTypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastMessageIdRef = useRef<string>();

  // Calculate adaptive speed based on text length
  // Target: Much faster animation, max 3 seconds
  const calculateAdaptiveSpeed = (textLength: number): { speed: number; lineDelay: number } => {
    const maxDuration = 3000; // 3 seconds maximum
    const minSpeed = 2; // Super fast
    const maxSpeed = 8; // Still fast for short texts
    
    if (textLength === 0) return { speed: maxSpeed, lineDelay: 10 };
    
    // Calculate speed to fit within 3 seconds
    const targetSpeed = Math.max(minSpeed, Math.min(maxSpeed, maxDuration / textLength));
    
    // Very fast line delays
    const adaptiveLineDelay = Math.max(5, Math.min(15, targetSpeed));
    
    return { speed: Math.round(targetSpeed), lineDelay: Math.round(adaptiveLineDelay) };
  };

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If not enabled or no text, show immediately
    if (!enabled || !text) {
      setDisplayedText(text);
      setIsComplete(true);
      setIsAnimating(false);
      return;
    }

    // Check if this is a new message (enabled and messageId changed)
    const isNewMessage = enabled && messageId && messageId !== lastMessageIdRef.current;
    
    if (isNewMessage) {
      lastMessageIdRef.current = messageId;
      
      // Calculate adaptive speeds based on text length
      const { speed: adaptiveSpeed, lineDelay: adaptiveLineDelay } = calculateAdaptiveSpeed(text.length);
      
      // Start animation for new message
      setDisplayedText("");
      setIsComplete(false);
      setIsAnimating(true);

      const lines = text.split('\n');
      let currentLineIndex = 0;
      let currentCharIndex = 0;

      const typeNextChar = () => {
        if (currentLineIndex >= lines.length) {
          setIsComplete(true);
          setIsAnimating(false);
          return;
        }

        const currentLine = lines[currentLineIndex];
        
        if (currentCharIndex >= currentLine.length) {
          // End of line - add newline and move to next line
          setDisplayedText(prev => prev + '\n');
          currentLineIndex++;
          currentCharIndex = 0;
          
          if (currentLineIndex < lines.length) {
            timeoutRef.current = setTimeout(typeNextChar, adaptiveLineDelay);
          } else {
            setIsComplete(true);
            setIsAnimating(false);
          }
        } else {
          // Add next character
          const nextChar = currentLine[currentCharIndex];
          setDisplayedText(prev => prev + nextChar);
          currentCharIndex++;
          timeoutRef.current = setTimeout(typeNextChar, adaptiveSpeed);
        }
      };

      // Start typing immediately
      timeoutRef.current = setTimeout(typeNextChar, 20);
      
    } else {
      // Old message - show immediately without animation
      setDisplayedText(text);
      setIsComplete(true);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, enabled, messageId, speed, lineDelay]);

  return {
    displayedText,
    isComplete,
    isAnimating
  };
}