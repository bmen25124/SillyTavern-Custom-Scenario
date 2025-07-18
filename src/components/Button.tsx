import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button className={`menu_button ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};
