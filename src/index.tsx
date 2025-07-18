import React from 'react';
import ReactDOM from 'react-dom/client';
import CreateApp from './create/App';
import PlayApp from './play/App';

{
  const characterButtons = $('.form_create_bottom_buttons_block');

  if (!characterButtons || characterButtons.length === 0) {
    throw new Error("Could not find root container element 'extensions_settings'");
  }

  const rootElement = document.createElement('div');
  characterButtons.prepend(rootElement);

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <CreateApp />
    </React.StrictMode>,
  );
}

{
  const searchButtons = document.querySelector('#rm_buttons_container') ?? document.querySelector('#form_character_search_form');
  if (!searchButtons) {
    throw new Error("Could not find root container elements 'rm_buttons_container'/'form_character_search_form'");
  }
  const rootElement = document.createElement('div');
  $(searchButtons).prepend(rootElement);
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PlayApp />
    </React.StrictMode>,
  );
}
