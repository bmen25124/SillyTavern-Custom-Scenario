import { useEffect, useRef, useState } from 'react';
import { Popup, POPUP_TYPE } from '../Popup';
import { PlayDialog, PlayDialogRef } from './PlayDialog';

interface AppProps {}

function App(props: AppProps) {
  const [showPopup, setShowPopup] = useState(false);
  const dialogRef = useRef<PlayDialogRef>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json, .png';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', async (e) => {
      // @ts-ignore
      const file = e.target.files?.[0] as File | null;
      if (file) {
        setShowPopup(true);
        setFile(file);
      }

      fileInput.remove();
    });
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  useEffect(() => {
    if (file && showPopup) {
      dialogRef.current?.handleFileSelect(file);
    }
  }, [file, showPopup]);

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
            onClosing: async (popup) => {
              if (popup.result === 1 && dialogRef.current) {
                // OK button clicked
                const valid = await dialogRef.current.validateAndPlay();
                return valid;
              }
              return true; // Allow closing for other cases (Cancel, X button)
            },
          }}
          onComplete={() => setShowPopup(false)}
        />
      )}
    </>
  );
}

export default App;
