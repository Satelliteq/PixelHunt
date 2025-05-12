import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Bebas Neue font (similar to Jersey 10)
import "@fontsource/bebas-neue";

// Initialize sample data
import { initializeSampleData } from "./lib/firebaseHelpers";

// Try to initialize sample data
(async () => {
  try {
    await initializeSampleData();
    console.log("Sample data initialized successfully");
  } catch (error) {
    console.error("Error initializing sample data:", error);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);