import { useState } from 'react';
import { Popup, POPUP_TYPE } from '../Popup';
import { CreateDialog } from './CreateDialog';

interface AppProps {}

function App(props: AppProps) {
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    setShowPopup(true);
  };

  const handleComplete = (value: any) => {
    setShowPopup(false);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="menu_button fa-solid fa-puzzle-piece interactable"
        title="Setup scenario"
      ></div>
      {showPopup && (
        <Popup
          content={<CreateDialog />}
          type={POPUP_TYPE.DISPLAY}
          options={{
            large: true,
            wide: true,
          }}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}

export default App;
