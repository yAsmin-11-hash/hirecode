import React from 'react';
import ResponsiveImage from './ResponsiveImage';

interface DynamicContentProps {
  html: string;
}

const DynamicContent: React.FC<DynamicContentProps> = ({ html }) => {
  // Simple regex to find img tags and replace them with ResponsiveImage
  // In a real app, we'd use a proper HTML parser like html-react-parser
  const parts = html.split(/(<img[^>]*>)/g);

  return (
    <div className="prose prose-invert max-w-none">
      {parts.map((part, index) => {
        if (part.startsWith('<img')) {
          const srcMatch = part.match(/src="([^"]*)"/);
          const altMatch = part.match(/alt="([^"]*)"/);
          const src = srcMatch ? srcMatch[1] : '';
          const alt = altMatch ? altMatch[1] : '';
          
          return (
            <div key={index} className="my-8">
              <ResponsiveImage src={src} alt={alt} />
            </div>
          );
        }
        return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </div>
  );
};

export default DynamicContent;
