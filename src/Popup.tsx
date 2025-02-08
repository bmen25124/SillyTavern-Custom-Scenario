import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// @ts-ignore
import dialogPolyfill from '../../../../../lib/dialog-polyfill.esm.js';
// @ts-ignore
// import { shouldSendOnEnter } from '../../../../RossAscends-mods.js';
// @ts-ignore
import { fixToastrForDialogs, Popup as STPopup } from '../../../../popup.js';
// @ts-ignore
import { removeFromArray, runAfterAnimation, uuidv4 } from '../../../../utils.js';

export enum POPUP_TYPE {
  TEXT = 1,
  CONFIRM = 2,
  INPUT = 3,
  DISPLAY = 4,
}

export enum POPUP_RESULT {
  AFFIRMATIVE = 1,
  NEGATIVE = 0,
  // @ts-ignore
  CANCELLED = null,
}

interface CustomPopupButton {
  text: string;
  result?: POPUP_RESULT | number;
  classes?: string[] | string;
  action?: () => void;
  appendAtEnd?: boolean;
}

interface CustomPopupInput {
  id: string;
  label: string;
  tooltip?: string;
  defaultState?: boolean;
}

interface PopupOptions {
  okButton?: string | boolean;
  cancelButton?: string | boolean;
  rows?: number;
  wide?: boolean;
  wider?: boolean;
  large?: boolean;
  transparent?: boolean;
  allowHorizontalScrolling?: boolean;
  allowVerticalScrolling?: boolean;
  animation?: 'slow' | 'fast' | 'none';
  defaultResult?: POPUP_RESULT | number;
  customButtons?: CustomPopupButton[] | string[];
  customInputs?: CustomPopupInput[];
  onClosing?: (popup: any) => Promise<boolean> | boolean;
  onClose?: (popup: any) => Promise<void> | void;
}

interface PopupProps {
  content: React.ReactNode;
  type: POPUP_TYPE;
  inputValue?: string;
  options?: PopupOptions;
  onComplete: (value: any) => void;
}

export const Popup: React.FC<PopupProps> = ({ content, type, inputValue = '', options = {}, onComplete }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const [isClosingPrevented, setIsClosingPrevented] = useState(false);
  const [lastFocus, setLastFocus] = useState<HTMLElement | null>(null);
  const id = useRef(uuidv4());

  // Create a reference object that mimics the original Popup instance
  const popupRef = useRef({
    id: id.current,
    type,
    dlg: null as HTMLDialogElement | null,
    mainInput: null as HTMLTextAreaElement | null,
    lastFocus: null as HTMLElement | null,
    value: undefined as any,
    result: undefined as any,
    inputResults: undefined as Map<string, boolean> | undefined,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Update the popup reference
    popupRef.current.dlg = dialog;
    popupRef.current.mainInput = mainInputRef.current;

    // Add to STPopup utility's popup array
    STPopup.util.popups.push(popupRef.current);

    if (!dialog.showModal) {
      dialog.classList.add('poly_dialog');
      dialogPolyfill.registerDialog(dialog);

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          dialogPolyfill.reposition(entry.target);
        }
      });
      resizeObserver.observe(dialog);
    }

    dialog.showModal();
    fixToastrForDialogs();

    return () => {
      // Remove from STPopup utility's popup array
      removeFromArray(STPopup.util.popups, popupRef.current);
      // Don't call dialog.close() here since it's handled in handleComplete
      fixToastrForDialogs();
    };
  }, []);

  const handleComplete = async (result: POPUP_RESULT | number) => {
    let value: any = result;

    if (type === POPUP_TYPE.INPUT) {
      if (result >= POPUP_RESULT.AFFIRMATIVE) value = mainInputRef.current?.value;
      else if (result === POPUP_RESULT.NEGATIVE) value = false;
      else if (result === POPUP_RESULT.CANCELLED) value = null;
      else value = false;
    }

    if (options.customInputs?.length) {
      const inputResults = new Map(
        options.customInputs.map((input) => {
          const inputControl = dialogRef.current?.querySelector(`#${input.id}`) as HTMLInputElement;
          return [inputControl.id, inputControl.checked];
        }),
      );
      popupRef.current.inputResults = inputResults;
    }

    // Update the popup reference with result and value
    popupRef.current.result = result;
    popupRef.current.value = value;

    if (options.onClosing) {
      const shouldClose = await options.onClosing(popupRef.current);
      if (!shouldClose) {
        setIsClosingPrevented(true);
        // Set values back if we cancel out of closing the popup
        popupRef.current.value = undefined;
        popupRef.current.result = undefined;
        popupRef.current.inputResults = undefined;
        return;
      }
    }

    setIsClosingPrevented(false);

    // Update STPopup's lastResult
    STPopup.util.lastResult = {
      value,
      result,
      inputResults: popupRef.current.inputResults,
    };

    // Start hiding process
    const dialog = dialogRef.current;
    if (!dialog) return;

    // We close the dialog, first running the animation
    dialog.setAttribute('closing', '');

    // Once the hiding starts, we need to fix the toastr to the layer below
    fixToastrForDialogs();

    // After the dialog is actually completely closed, remove it from the DOM
    runAfterAnimation(dialog, async () => {
      // Call the close on the dialog
      dialog.close();

      // Run a possible custom handler right before DOM removal
      if (options.onClose) {
        await options.onClose(popupRef.current);
      }

      // Remove it from the popup references
      removeFromArray(STPopup.util.popups, popupRef.current);

      // If there is any popup below this one, see if we can set the focus
      if (STPopup.util.popups.length > 0) {
        const activeDialog = document.activeElement?.closest('.popup');
        const id = activeDialog?.getAttribute('data-id');
        // @ts-ignore
        const popup = STPopup.util.popups.find((x) => x.id === id);
        if (popup) {
          if (popup.lastFocus) popup.lastFocus.focus();
        }
      }

      // Don't manually remove the dialog - let React handle it
      onComplete(value);
    });
  };

  const handleFocusIn = (evt: React.FocusEvent) => {
    if (evt.target instanceof HTMLElement && evt.target !== dialogRef.current) {
      setLastFocus(evt.target);
      popupRef.current.lastFocus = evt.target;
    }
  };

  const handleKeyDown = async (evt: React.KeyboardEvent) => {
    // if (evt.key === 'Enter' && !evt.altKey && !evt.shiftKey) {
    //   const textarea = evt.target as HTMLTextAreaElement;
    //   if (textarea.tagName === 'TEXTAREA' && !shouldSendOnEnter()) return;
    //   const input = evt.target as HTMLInputElement;
    //   if (input.tagName === 'INPUT' && input.type === 'text' && !shouldSendOnEnter()) return;
    //   evt.preventDefault();
    //   evt.stopPropagation();
    //   await handleComplete(options.defaultResult ?? POPUP_RESULT.AFFIRMATIVE);
    // }
  };

  const getClassNames = () => {
    const classes = ['popup'];
    if (options.wide) classes.push('wide_dialogue_popup');
    if (options.wider) classes.push('wider_dialogue_popup');
    if (options.large) classes.push('large_dialogue_popup');
    if (options.transparent) classes.push('transparent_dialogue_popup');
    if (options.allowHorizontalScrolling) classes.push('horizontal_scrolling_dialogue_popup');
    if (options.allowVerticalScrolling) classes.push('vertical_scrolling_dialogue_popup');
    if (options.animation) classes.push(`popup--animation-${options.animation}`);
    return classes.join(' ');
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={getClassNames()}
      data-id={id.current}
      onKeyDown={handleKeyDown}
      onFocus={handleFocusIn}
    >
      <div className="popup-body">
        <div className="popup-content">{content}</div>

        {type === POPUP_TYPE.INPUT && (
          <textarea
            ref={mainInputRef}
            className="popup-input text_pole result-control auto-select"
            rows={options.rows ?? 1}
            defaultValue={inputValue}
            data-result="1"
            data-result-event="submit"
          />
        )}

        {options.customInputs && (
          <div className="popup-inputs">
            {options.customInputs.map((input) => (
              <label key={input.id} className="checkbox_label justifyCenter" htmlFor={input.id}>
                <input type="checkbox" id={input.id} defaultChecked={input.defaultState} />
                <span data-i18n={input.label}>{input.label}</span>
                {input.tooltip && (
                  <div
                    className="fa-solid fa-circle-info opacity50p"
                    title={input.tooltip}
                    data-i18n={`[title]${input.tooltip}`}
                  />
                )}
              </label>
            ))}
          </div>
        )}

        {type !== POPUP_TYPE.DISPLAY && (
          <div className="popup-controls">
            {options.customButtons?.map((button, index) => {
              const buttonConfig = typeof button === 'string' ? { text: button, result: index + 2 } : button;

              return (
                <div
                  key={index}
                  className={`menu_button popup-button-custom result-control ${buttonConfig.classes ?? ''}`}
                  data-result={buttonConfig.result}
                  onClick={() => {
                    buttonConfig.action?.();
                    handleComplete(buttonConfig.result ?? index + 2);
                  }}
                  data-i18n={buttonConfig.text}
                >
                  {buttonConfig.text}
                </div>
              );
            })}

            {/* @ts-ignore */}
            {type !== POPUP_TYPE.DISPLAY && options.okButton !== false && (
              <div
                className="popup-button-ok menu_button result-control"
                onClick={() => handleComplete(POPUP_RESULT.AFFIRMATIVE)}
                data-result="1"
              >
                {typeof options.okButton === 'string' ? options.okButton : 'OK'}
              </div>
            )}

            {/* @ts-ignore */}
            {type !== POPUP_TYPE.DISPLAY && options.cancelButton !== false && (
              <div
                className="popup-button-cancel menu_button result-control"
                onClick={() => handleComplete(POPUP_RESULT.NEGATIVE)}
                data-result="0"
              >
                {typeof options.cancelButton === 'string' ? options.cancelButton : 'Cancel'}
              </div>
            )}
          </div>
        )}

        {type === POPUP_TYPE.DISPLAY && (
          <div
            className="popup-button-close right_menu_button fa-solid fa-circle-xmark"
            onClick={() => handleComplete(POPUP_RESULT.CANCELLED)}
            data-result="0"
            title="Close popup"
            data-i18n="[title]Close popup"
          />
        )}
      </div>
    </dialog>,
    document.body,
  );
};
