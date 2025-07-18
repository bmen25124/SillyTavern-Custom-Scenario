import { Button } from '../components/Button';

interface QuestionTabButtonProps {
  inputId: string;
  onSelect: () => void;
  onRemove: () => void;
  className?: string;
}

export const QuestionTabButton: React.FC<QuestionTabButtonProps> = ({ inputId, onSelect, onRemove, className }) => {
  return (
    <div className="tab-button-container">
      <Button className={`tab-button question ${className}`} onClick={onSelect}>
        Question {inputId}
      </Button>
      <Button className="remove-input-btn danger" title="Remove Question" onClick={onRemove}>
        <i className="fa-solid fa-trash"></i>
      </Button>
    </div>
  );
};
