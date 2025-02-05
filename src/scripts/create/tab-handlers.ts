import { saveScenarioCreateData, getScenarioCreateDataFromUI } from './data-handlers';
import { updateScriptInputs } from './script-handlers';
import { updateQuestionScriptInputs } from './script-handlers';

type CoreTab = 'description' | 'first-message' | 'scenario' | 'personality' | 'character-note';
type TabId = CoreTab | string;

const CORE_TABS: CoreTab[] = ['description', 'first-message', 'scenario', 'personality', 'character-note'];

/**
 * Sets up tab switching functionality with auto-save
 */
export function setupTabFunctionality(popup: JQuery<HTMLElement>) {
  // Core tab handling
  popup.on('click', '.tab-button', function () {
    const tabId = $(this).data('tab');
    if (!tabId) return;

    // Save current state before switching tabs
    const currentData = getScenarioCreateDataFromUI(popup);
    saveScenarioCreateData(currentData);

    switchTab(tabId);
  });

  // Page button handling
  // Enable drag and drop for page buttons
  popup.find('#page-tab-buttons').on('mouseenter', '.page-button-container', function () {
    $(this).attr('draggable', 'true');
  });

  let draggedItem: HTMLElement | null = null;
  let originalIndex: number = -1;

  popup.on('dragstart', '.page-button-container', function (e) {
    draggedItem = this;
    originalIndex = $(this).index();
    e.originalEvent?.dataTransfer?.setData('text/plain', '');
    $(this).addClass('dragging');
  });

  popup.on('dragend', '.page-button-container', function () {
    $(this).removeClass('dragging');
    draggedItem = null;
  });

  // Create placeholder
  const placeholder = $(
    '<div class="page-button-container placeholder"><button class="page-button-placeholder menu_button">Drop Here</button></div>',
  );
  placeholder.hide();

  popup.on('dragover', '.page-button-container', function (e) {
    e.preventDefault();
    if (!draggedItem || draggedItem === this) return;

    const rect = this.getBoundingClientRect();
    const dropPosition = e.originalEvent!.clientY - rect.top > rect.height / 2 ? 'after' : 'before';

    // Remove drop indicators
    popup.find('.page-button-container').removeClass('drop-before drop-after');
    $(this).addClass(`drop-${dropPosition}`);

    // Position placeholder
    if (dropPosition === 'before') {
      $(this).before(placeholder);
    } else {
      $(this).after(placeholder);
    }
    placeholder.show();

    // Live preview: Update questions during drag
    const questions = popup.find('#questions-container');
    const draggedPageNum = parseInt($(draggedItem).find('.page-button').data('page'));
    const targetPageNum = parseInt($(this).find('.page-button').data('page'));
    const draggedQuestions = questions.find(`.tab-button-container[data-page="${draggedPageNum}"]`);
    const targetQuestions = questions.find(`.tab-button-container[data-page="${targetPageNum}"]`);

    if (dropPosition === 'before' && targetQuestions.length) {
      targetQuestions.first().before(draggedQuestions);
    } else if (targetQuestions.length) {
      targetQuestions.last().after(draggedQuestions);
    }
  });

  popup.on('dragleave', '.page-button-container', function (e) {
    const event = e.originalEvent as DragEvent;
    if (!event.relatedTarget || !(event.relatedTarget instanceof Element) || !$.contains(this, event.relatedTarget)) {
      $(this).removeClass('drop-before drop-after');
      placeholder.hide();
    }
  });

  popup.on('drop', '.page-button-container', function (e) {
    e.preventDefault();

    // Remove indicators
    $(this).removeClass('drop-before drop-after');
    placeholder.hide();

    if (!draggedItem || draggedItem === this) return;

    const dropTarget = this;
    const rect = dropTarget.getBoundingClientRect();
    const dropAfter = e.originalEvent!.clientY - rect.top > rect.height / 2;

    // Update page button positions
    if (dropAfter) {
      $(dropTarget).after(draggedItem);
    } else {
      $(dropTarget).before(draggedItem);
    }

    // Build mapping from old page numbers to new ones
    const pageMap = new Map<number, number>();
    const pageButtons = popup.find('#page-tab-buttons .page-button-container:not(.placeholder) .page-button');

    pageButtons.each(function (index) {
      const oldPageNum = parseInt($(this).data('page'));
      pageMap.set(oldPageNum, index + 1);
    });

    // First update all questions to use new page numbers
    const questions = popup.find('#questions-container');
    questions.find('.tab-button-container').each(function () {
      const oldPageNum = parseInt($(this).attr('data-page') || '0');
      if (oldPageNum > 0) {
        const newPageNum = pageMap.get(oldPageNum)!;
        $(this).attr('data-page', newPageNum).data('page', newPageNum);
      }
    });

    // Then update all page buttons
    pageButtons.each(function (index) {
      const newPageNum = index + 1;
      $(this).text(`Page ${newPageNum}`).attr('data-page', newPageNum).data('page', newPageNum);
    });

    // Save current state before switching tabs
    const currentData = getScenarioCreateDataFromUI(popup);
    saveScenarioCreateData(currentData);
  });

  // Handle regular page button clicks
  popup.on('click', '.page-button', function () {
    const pageNum = $(this).data('page');
    if (!pageNum) return;

    togglePage(pageNum);
  });

  // Add page button handling
  popup.on('click', '#add-page-btn', function () {
    const pageButtons = popup.find('.page-button');
    const newPageNum = pageButtons.length + 1;
    const newPageButton = createPageButton(newPageNum);

    // Add the new page button
    popup.find('#page-tab-buttons').append(newPageButton);

    // Switch to the new page
    togglePage(newPageNum);

    // Save the current state
    const currentData = getScenarioCreateDataFromUI(popup);
    if (!currentData.layout[newPageNum - 1]) {
      currentData.layout[newPageNum - 1] = [];
    }
    saveScenarioCreateData(currentData);
  });

  // Remove page button handling
  popup.on('click', '#remove-page-btn', function () {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    // Check if the current page has any questions
    const questionTabs = popup.find(`.tab-button-container[data-page="${currentPage}"]`);
    if (questionTabs.length > 0) {
      alert('Cannot remove a page that contains questions. Please move or delete the questions first.');
      return;
    }

    // Get the current state
    const currentData = getScenarioCreateDataFromUI(popup);

    // Remove the page from layout
    currentData.layout.splice(currentPage - 1, 1);
    saveScenarioCreateData(currentData);

    // Remove the page button
    popup.find(`.page-button[data-page="${currentPage}"]`).parent().remove();

    // Renumber remaining pages
    renumberPages(popup, currentPage);

    // Switch to the previous page or page 1
    const newPage = Math.max(1, currentPage - 1);
    togglePage(newPage);
  });

  // Initial state
  switchTab('description');
}

/**
 * Sets up accordion functionality
 */
export function setupAccordion(popup: JQuery<HTMLElement>) {
  const accordionToggles = popup.find('.accordion-toggle');

  accordionToggles.on('click', function () {
    $(this).closest('.accordion').toggleClass('open');
  });
}

/**
 * Gets the current active page number
 */
export function getCurrentPage(): number {
  const activePageButton = $('.page-button.active');
  return activePageButton.length ? parseInt(activePageButton.data('page')) : 1;
}

/**
 * Renumbers pages after a page is removed
 * @param popup The popup jQuery element
 * @param removedPageNumber The number of the page that was removed
 */
function renumberPages(popup: JQuery<HTMLElement>, removedPageNumber: number) {
  // First, update questions from the higher pages to have correct page numbers
  for (let i = removedPageNumber + 1; i <= popup.find('.page-button').length + 1; i++) {
    // Move questions from higher pages down one number
    const questionsToUpdate = popup.find(`.tab-button-container[data-page="${i}"]`);
    questionsToUpdate.attr('data-page', i - 1);
  }

  // Then update the page buttons
  popup.find('.page-button').each(function (index) {
    const newPageNum = index + 1;
    const pageButton = $(this);

    // Update button text and data attribute
    pageButton.text(`Page ${newPageNum}`).attr('data-page', newPageNum).data('page', newPageNum);
  });
}

/**
 * Toggles visibility of questions for a specific page
 */
export function togglePage(pageNum: number) {
  const popup = $('#scenario-create-dialog');
  const container = popup.find('#questions-container');
  const pageButton = popup.find(`.page-button[data-page="${pageNum}"]`);
  const questionTabs = popup.find(`.tab-button-container[data-page="${pageNum}"]`);

  // Toggle active state for page button
  popup.find('.page-button').removeClass('active');
  pageButton.addClass('active');

  // Toggle visibility of questions
  container.find('.tab-button-container').hide();
  questionTabs.show();

  // If there's no active question tab visible, activate the first one
  const activeTab = container.find('.tab-button.active');
  if (!activeTab.length || !activeTab.closest('.tab-button-container').is(':visible')) {
    const firstVisibleTab = questionTabs.first().find('.tab-button');
    if (firstVisibleTab.length) {
      switchTab(firstVisibleTab.data('tab'));
    }
  }

  // Save current state before switching tabs
  const currentData = getScenarioCreateDataFromUI(popup);
  saveScenarioCreateData(currentData);
}

/**
 * Switches to the specified tab. It is only for core and question tabs. Not page.
 */
export function switchTab(tabId: TabId) {
  const popup = $('#scenario-create-dialog');
  const $popup = popup as JQuery<HTMLElement>;

  $popup.find('.tab-button').removeClass('active');
  $popup.find('.tab-content').removeClass('active');
  $popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
  $popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');

  // Update script inputs based on active tab
  if (CORE_TABS.includes(tabId as CoreTab)) {
    updateScriptInputs($popup, tabId as CoreTab);
  } else {
    updateQuestionScriptInputs($popup.find(`.dynamic-input-group[data-tab="${tabId}"]`));
  }
}

/**
 * Creates a new page button
 */
export function createPageButton(pageNum: number): JQuery<HTMLElement> {
  const template = document.querySelector<HTMLTemplateElement>('#page-button-template');
  if (!template) throw new Error('Page button template not found');

  const content = template.content.cloneNode(true) as DocumentFragment;
  const container = content.querySelector('.page-button-container');
  if (!container) throw new Error('Page button container not found in template');

  const buttonHtml = container.outerHTML.replace(/\{page\}/g, pageNum.toString());
  return $(buttonHtml) as JQuery<HTMLElement>;
}
