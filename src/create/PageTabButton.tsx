import { Button } from '../components/Button';

interface PageTabButtonProps {
  page: number;
  onClick: () => void;
  isActive?: boolean;
}

export const PageTabButton: React.FC<PageTabButtonProps> = ({ page, onClick, isActive = false }) => {
  return (
    <div className="page-button-container">
      <Button className={`page-button ${isActive ? 'active' : ''}`} onClick={onClick}>
        Page {page}
      </Button>
    </div>
  );
};
