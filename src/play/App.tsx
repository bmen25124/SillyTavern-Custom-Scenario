import { useRef, useState } from 'react';
import { Popup, POPUP_TYPE } from '../Popup';
import { PlayDialog } from './PlayDialog';

interface AppProps { }

function App(props: AppProps) {
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    setShowPopup(true);
  };

  const dialogRef = useRef<{ validateAndPlay: () => Promise<boolean> }>(null);

  const handleComplete = async (value: any) => {
    if (value === 1 && dialogRef.current) { // OK button clicked
      const valid = await dialogRef.current.validateAndPlay();
      if (!valid) {
        return;
      }
    }
    setShowPopup(false);
  };

  return (
    <>
      <div className="menu_button fa-solid fa-play interactable" onClick={handleClick} title="Play scenario"></div>
      {showPopup && (
        <Popup
          content={<PlayDialog ref={dialogRef} onClose={() => setShowPopup(false)} />}
          type={POPUP_TYPE.TEXT}
          options={{
            okButton: true,
            cancelButton: true,
            wider: true,
          }}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}

export default App;
