import { useState, useEffect, useRef } from "react";

interface UseTypewriterProps {
  text: string;
  speed?: number; // milliseconds per character
  lineDelay?: number; // milliseconds to pause between lines
  enabled?: boolean;
}

export function useTypewriter({ 
  text, 
  speed = 30, 
  lineDelay = 200, 
  enabled = true 
}: UseTypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Split text into lines for line-by-line animation
  const lines = text.split('\n');

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    // Reset state when text changes
    setDisplayedText("");
    setCurrentLineIndex(0);
    setCurrentCharIndex(0);
    setIsComplete(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const typeText = () => {
      if (currentLineIndex >= lines.length) {
        setIsComplete(true);
        return;
      }

      const currentLine = lines[currentLineIndex];
      
      if (currentCharIndex >= currentLine.length) {
        // Finished current line, move to next after delay
        timeoutRef.current = setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1);
          setCurrentCharIndex(0);
          setDisplayedText(prev => prev + '\n');
        }, lineDelay);
      } else {
        // Type next character
        const nextChar = currentLine[currentCharIndex];
        setDisplayedText(prev => prev + nextChar);
        setCurrentCharIndex(prev => prev + 1);
        
        timeoutRef.current = setTimeout(typeText, speed);
      }
    };

    // Start typing
    timeoutRef.current = setTimeout(typeText, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, lineDelay, enabled, currentLineIndex, currentCharIndex, lines]);

  return {
    displayedText,
    isComplete,
    progress: text.length > 0 ? displayedText.length / text.length : 1
  };
}