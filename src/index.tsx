import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// @ts-ignore
import { getContext } from '../../../../extensions.js';

const characterButtons = $('.form_create_bottom_buttons_block');

if (!characterButtons || characterButtons.length === 0) {
  throw new Error("Could not find root container element 'extensions_settings'");
}

const rootElement = document.createElement('div');
characterButtons.prepend(rootElement);

console.log(getContext());

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
