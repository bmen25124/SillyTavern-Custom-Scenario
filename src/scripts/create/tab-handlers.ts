import { stEcho } from '../config';
import { CORE_TABS, CoreTab, TabId } from '../types';
import { saveScenarioCreateData, getScenarioCreateDataFromUI } from './data-handlers';
import { checkDuplicateQuestionIds } from './question-handlers';
import { updateScriptInputs } from './script-handlers';
import { updateQuestionScriptInputs } from './script-handlers';

const ANIMATION_DURATION = 300; // Match this with CSS animation duration (0.3s = 300ms)

let isAnimating = false;

/**
 * Sets up tab switching functionality with auto-save
 */
export function setupTabFunctionality(popup: JQuery<HTMLElement>) {
  // Core tab handling
  popup.on('click', '.tab-button', function () {
    const tabId = $(this).data('tab');
    if (!tabId) return;

    switchTab(popup, tabId);
  });

  // Handle page reordering with global move buttons
  popup.on('click', '#move-page-left-btn, #move-page-right-btn', async function (e) {
    e.preventDefault();

    // Prevent multiple animations
    if (isAnimating) return;
    isAnimating = true;

    const moveButton = $(this);
    const isUp = moveButton.attr('id') === 'move-page-left-btn';

    // Disable move buttons during animation
    popup.find('#move-page-left-btn, #move-page-right-btn').prop('disabled', true);

    // Find active page
    const activePageButton = popup.find('.page-button.active');
    if (!activePageButton.length) {
      isAnimating = false;
      popup.find('#move-page-left-btn, #move-page-right-btn').prop('disabled', false);
      return;
    }

    const container = activePageButton.closest('.page-button-container');
    const sibling = isUp ? container.prev('.page-button-container') : container.next('.page-button-container');

    if (sibling.length === 0) {
      isAnimating = false;
      popup.find('#move-page-left-btn, #move-page-right-btn').prop('disabled', false);
      return;
    }

    // Get the page numbers
    const pageNum = parseInt(activePageButton.data('page'));
    const siblingPageNum = parseInt(sibling.find('.page-button').data('page'));

    try {
      // Add animation class only to active container
      const moveClass = isUp ? 'moving-left' : 'moving-right';
      container.addClass(moveClass);

      // Get associated questions
      const questions = popup.find('#questions-container');
      const movedQuestions = questions.find(`.tab-button-container[data-page="${pageNum}"]`);
      const siblingQuestions = questions.find(`.tab-button-container[data-page="${siblingPageNum}"]`);

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

      // Swap page numbers in DOM
      activePageButton.text(`Page ${siblingPageNum}`).attr('data-page', siblingPageNum).data('page', siblingPageNum);
      sibling.find('.page-button').text(`Page ${pageNum}`).attr('data-page', pageNum).data('page', pageNum);

      // Update question page numbers
      movedQuestions.attr('data-page', siblingPageNum).data('page', siblingPageNum);
      siblingQuestions.attr('data-page', pageNum).data('page', pageNum);

      // Move the containers
      if (isUp) {
        container.insertBefore(sibling);
        movedQuestions.first().before(siblingQuestions);
      } else {
        container.insertAfter(sibling);
        siblingQuestions.last().after(movedQuestions);
      }

      // Remove animation class
      container.removeClass(moveClass);

      // Save current state
      saveScenarioCreateData(getScenarioCreateDataFromUI(popup));
    } finally {
      // Always cleanup, even if there's an error
      isAnimating = false;
      popup.find('#move-page-left-btn, #move-page-right-btn').prop('disabled', false);
    }
  });

  // Handle regular page button clicks
  popup.on('click', '.page-button', function () {
    const pageNum = $(this).data('page');
    if (!pageNum) return;

    togglePage(popup, pageNum);
  });

  // Add page button handling
  popup.on('click', '#add-page-btn', function () {
    const pageButtons = popup.find('.page-button');
    const newPageNum = pageButtons.length + 1;
    const newPageButton = createPageButton(popup, newPageNum);

    // Add the new page button
    popup.find('#page-tab-buttons').append(newPageButton);

    // Switch to the new page
    togglePage(popup, newPageNum);

    // Update the page select dropdown
    const pageSelect = popup.find('#page-select');
    pageSelect.append($('<option>').val(newPageNum).text(`Page ${newPageNum}`));

    // Save the current state
    saveScenarioCreateData(getScenarioCreateDataFromUI(popup));
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
    const totalPages = popup.find('.page-button').length;
    if (totalPages === 1) {
      alert('Cannot remove the last page.');
      return;
    }

    // Remove the page button
    popup.find(`.page-button[data-page="${currentPage}"]`).parent().remove();

    // Renumber remaining pages
    renumberPages(popup, currentPage);

    // Switch to the previous page or page 1
    const newPage = Math.max(1, currentPage - 1);
    togglePage(popup, newPage);

    // Save the current state
    saveScenarioCreateData(getScenarioCreateDataFromUI(popup));
  });

  // Initial state
  switchTab(popup, 'description');
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

  const pageSelect = popup.find('#page-select');
  const oldSelectedValue = pageSelect.val() as string;
  if (oldSelectedValue) {
    pageSelect.empty();
  }

  // Then update the page buttons
  popup.find('.page-button').each(function (index) {
    const newPageNum = index + 1;
    const pageButton = $(this);

    // Update button text and data attribute
    pageButton.text(`Page ${newPageNum}`).attr('data-page', newPageNum).data('page', newPageNum);

    if (oldSelectedValue) {
      const option = $('<option>').val(newPageNum).text(`Page ${newPageNum}`);
      pageSelect.append(option);
    }
  });

  // Restore the selected value
  if (oldSelectedValue) {
    pageSelect.empty();
    const oldSelectedPage = parseInt(oldSelectedValue);
    pageSelect.val(oldSelectedPage > removedPageNumber ? oldSelectedPage - 1 : oldSelectedPage);
  }
}

/**
 * Toggles visibility of questions for a specific page
 */
export function togglePage(popup: JQuery<HTMLElement>, pageNum: number) {
  const container = popup.find('#questions-container');
  const pageButton = popup.find(`.page-button[data-page="${pageNum}"]`);
  const questionTabs = popup.find(`.tab-button-container[data-page="${pageNum}"]`);

  // Toggle active state for page button
  popup.find('.page-button').removeClass('active');
  pageButton.addClass('active');

  // Toggle visibility of questions
  container.find('.tab-button-container').hide();
  questionTabs.show();
}

/**
 * Switches to the specified tab. Handles both core tabs and question tabs.
 */
export async function switchTab(popup: JQuery<HTMLElement>, tabId: TabId) {
  // Check duplicate question ids
  const activeTabButton = popup.find(`.tab-button.active`);
  if (activeTabButton.length) {
    const tabData = activeTabButton.data('tab');
    if (tabData && tabData.startsWith('question-')) {
      const inputId = tabData.replace('question-', '');
      if (!inputId) {
        await stEcho('error', 'Empty question IDs are not allowed.');
        return;
      }
      // Check for duplicate IDs before proceeding
      const duplicateId = checkDuplicateQuestionIds(popup);
      if (duplicateId) {
        await stEcho('error', `Question ID "${duplicateId}" already exists.`);
        return;
      }
    }
  }

  popup.find('.tab-button').removeClass('active');
  popup.find('.tab-content').removeClass('active');
  popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
  popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');

  const currentData = getScenarioCreateDataFromUI(popup);
  currentData.activeTab = tabId;

  const pageSelect = popup.find('#page-select');
  pageSelect.empty();

  // Update script inputs based on active tab
  if (CORE_TABS.includes(tabId as CoreTab)) {
    pageSelect.prepend($('<option>').val('').text('None'));
    pageSelect.val('');
    popup.find('#questions-container .button-group').hide();
    updateScriptInputs(popup, tabId as CoreTab);
  } else {
    // For question tabs, preserve the page number in activeTab
    const questionElement = popup.find(`.tab-button[data-tab="${tabId}"]`).closest('.tab-button-container');
    const pageNum = parseInt(questionElement.attr('data-page') as string);
    togglePage(popup, pageNum);
    popup.find('.page-button').each(function (index) {
      const page = index + 1;
      pageSelect.append($('<option>').val(page).text(`Page ${page}`));
    });
    pageSelect.val(pageNum);
    popup.find('#questions-container .button-group').show();
    updateQuestionScriptInputs(popup, popup.find(`.dynamic-input-group[data-tab="${tabId}"]`));
  }

  // Save updated state
  saveScenarioCreateData(currentData);
}

/**
 * Creates a new page button
 */
export function createPageButton(popup: JQuery<HTMLElement>, pageNum: number): JQuery<HTMLElement> {
  const template = popup.find('#page-button-template');
  if (template.length === 0) throw new Error('Page button template not found');

  const buttonHtml = template.html()?.replace(/\{page\}/g, pageNum.toString());
  if (!buttonHtml) throw new Error('Page button template is empty');

  const container = $('<div>').html(buttonHtml);
  return container.children().first();
}
