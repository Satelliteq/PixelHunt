import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Bebas Neue font (similar to Jersey 10)
import "@fontsource/bebas-neue";

// Initialize sample data
import { initializeSampleData } from "./lib/firebaseHelpers";

// Try to initialize sample data with better error handling
(async () => {
  try {
    await initializeSampleData();
    console.log("Sample data initialized successfully");
  } catch (error) {
    // More detailed error logging
    console.error("Error initializing sample data:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Continue loading the app even if sample data fails
    console.log("Continuing app initialization despite sample data error");
  }
})();

createRoot(document.getElementById("root")!).render(<App />);