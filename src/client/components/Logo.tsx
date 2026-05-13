import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <img 
      src="/tahfiz-logo.png" 
      alt="Tahfiz Academy Logo" 
      className={className} 
    />
  );
};
