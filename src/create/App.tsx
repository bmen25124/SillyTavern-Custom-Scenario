import { useState } from 'react';
import { Popup, POPUP_TYPE } from '../Popup';
import { st_popupConfirm } from '../config';
import { CreateDialog } from './CreateDialog';

interface AppProps {}

function App(props: AppProps) {
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    setShowPopup(true);
  };

  const handleComplete = (value: any) => {
    console.log('Popup result:', value);
    setShowPopup(false);
  };

  const handleSecondsClick = async () => {
    const confirmedResult = await st_popupConfirm('heheheh boi');
    console.log(confirmedResult);
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
