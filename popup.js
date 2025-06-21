// SuperCursor | popup.js
// This script handles the logic for the extension's popup UI.

document.addEventListener('DOMContentLoaded', function () {
  const cursorSelect = document.getElementById('cursor-select');
  const applyButton = document.getElementById('apply-button');

  /**
   * On popup load, retrieve the saved cursor preference from chrome.storage.sync
   * and set the dropdown to reflect the current choice.
   */
  chrome.storage.sync.get('selectedCursor', function (data) {
    if (data.selectedCursor) {
      cursorSelect.value = data.selectedCursor;
    }
  });

  /**
   * When the "Apply" button is clicked, this listener performs two actions:
   * 1. Saves the newly selected cursor to chrome.storage.sync for persistence.
   * 2. Sends a message to the content script in the active tab to update the cursor instantly.
   */
  applyButton.addEventListener('click', function () {
    const selectedCursor = cursorSelect.value;

    // 1. Save the selected cursor preference.
    chrome.storage.sync.set({ selectedCursor: selectedCursor }, function () {
      console.log('Cursor style saved:', selectedCursor);
    });

    // 2. Send a message to the active tab's content script to apply the cursor.
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: 'setCursor',
            cursor: selectedCursor,
          },
          () => {
            // This callback is used to handle chrome.runtime.lastError, which occurs
            // when the content script is not available on the receiving end (e.g., on
            // chrome:// pages or the web store). We intentionally leave this empty
            // to prevent error messages from appearing in the console for this
            // expected scenario.
            void chrome.runtime.lastError;
          }
        );
      }
    });
  });
}); 