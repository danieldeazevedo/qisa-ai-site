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
  speed = 25, 
  lineDelay = 150, 
  enabled = true,
  messageId
}: UseTypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastMessageIdRef = useRef<string>();

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

    // Check if this is a new message
    const isNewMessage = messageId && messageId !== lastMessageIdRef.current;
    
    if (isNewMessage) {
      lastMessageIdRef.current = messageId;
      
      // Start animation for new message
      setDisplayedText("");
      setIsComplete(false);
      setIsAnimating(true);

      let currentIndex = 0;
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
            timeoutRef.current = setTimeout(typeNextChar, lineDelay);
          } else {
            setIsComplete(true);
            setIsAnimating(false);
          }
        } else {
          // Add next character
          const nextChar = currentLine[currentCharIndex];
          setDisplayedText(prev => prev + nextChar);
          currentCharIndex++;
          timeoutRef.current = setTimeout(typeNextChar, speed);
        }
      };

      // Start typing after small delay
      timeoutRef.current = setTimeout(typeNextChar, 200);
      
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