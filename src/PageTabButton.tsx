interface PageTabButtonProps {
  page: number;
  onClick: () => void;
  isActive?: boolean;
}

export const PageTabButton: React.FC<PageTabButtonProps> = ({ page, onClick, isActive = false }) => {
  return (
    <div className="page-button-container">
      <button className={`page-button menu_button ${isActive ? 'active' : ''}`} onClick={onClick}>
        Page {page}
      </button>
    </div>
  );
};
