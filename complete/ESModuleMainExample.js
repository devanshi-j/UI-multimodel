// Import from the module
import { initializeAR, itemCategories } from './ar-furniture.js';

// Initialize when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Start the AR experience
  initializeAR(itemCategories)
    .then(state => {
      console.log("AR Furniture Viewer initialized successfully");
    })
    .catch(error => {
      console.error("Failed to initialize AR Furniture Viewer:", error);
    });
});
