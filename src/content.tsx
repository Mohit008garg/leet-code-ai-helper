import React from 'react';
import { createRoot } from 'react-dom/client';
import AiAssistButton from './AiAssistButton';

/**
 * Injects the AI Assist button into the page
 */
const injectButton = () => {
  // Prevent duplicates
  if (document.getElementById('ai-assist-container')) return;

  // Create a container div
  const container = document.createElement('div');
  container.id = 'ai-assist-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '10000';
  document.body.appendChild(container);

  // Mount React component
  const root = createRoot(container);
  root.render(<AiAssistButton />);
};

/**
 * Initialize content script
 * - Wait for DOM ready
 * - Check if API key exists in chrome.storage.local
 * - Inject button only if key is set
 */
const init = () => {
  chrome.storage.local.get("userApiKey", (res) => {
    if (res.userApiKey) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectButton);
      } else {
        injectButton();
      }
    } else {
      console.log("AI Assist: No API key found, not injecting button.");
    }
  });
};

// Run initialization
init();
