import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => {
  return (
    <select className={`text_pole ${className}`.trim()} {...props}>
      {children}
    </select>
  );
};
