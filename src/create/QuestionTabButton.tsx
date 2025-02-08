interface QuestionTabButtonProps {
  inputId: string;
  onSelect: () => void;
  onRemove: () => void;
  className?: string;
}

export const QuestionTabButton: React.FC<QuestionTabButtonProps> = ({ inputId, onSelect, onRemove, className }) => {
  return (
    <div className="tab-button-container">
      <button className={`tab-button menu_button question ${className}`} onClick={onSelect}>
        Question {inputId}
      </button>
      <button className="remove-input-btn menu_button danger" title="Remove Question" onClick={onRemove}>
        <i className="fa-solid fa-trash"></i>
      </button>
    </div>
  );
};
