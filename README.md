# AI-Mazon

**AI-Mazon** is a Chrome extension that enhances your Amazon shopping experience by providing AI-powered product summaries, pros & cons, and review insights directly on the search results page.

## Key Features

- **Instant Summaries**: Get a concise summary of any product without leaving the search page.
- **Smart Analysis**: View automatically generated "Pros" and "Cons" based on product details and reviews.
- **Review Insights**: A dedicated section summarizing user sentiment and reviews.
- **Image Carousel**: Browse high-resolution product images within the summary popup.
- **Persistent Access**: A non-intrusive "+" button appears on product cards for easy access.

## Architecture

The project consists of two main components:
1.  **Chrome Extension**: A manifest V3 extension that injects a content script into Amazon pages to detect products and display the UI.
2.  **Backend Server**: A FastAPI (Python) server that handles web scraping and communicates with the Gemini API to generate summaries.

## Installation & Setup

### Prerequisites

- Python 3.8+
- Google Gemini API Key
- Google Chrome (or Chromium-based browser)

### 1. Backend Setup

1.  Navigate to the `server` directory.
2.  Install the required Python packages:
    ```bash
    pip install fastapi uvicorn requests beautifulsoup4 lxml python-dotenv google-generativeai pydantic
    ```
3.  Create a `.env` file in the root directory (or `server/` directory) and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
4.  Start the server:
    ```bash
    python server/main.py
    ```
    The server will start at `http://127.0.0.1:5000`.

### 2. Extension Setup

1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked**.
4.  Select the `extension` folder from this project.
5.  The **AI-Mazon** extension should now be active.

## How to Use

1.  Ensure the backend server is running.
2.  Visit [Amazon.com](https://www.amazon.com) or [Amazon.in](https://www.amazon.in).
3.  Hover over any product card in the search results.
4.  Click the **"+"** button that appears on the product image.
5.  A popup will appear with the AI-generated summary, images, and review insights.

## Troubleshooting

-   **Server Error**: Ensure the backend server is running and the port `5000` is free. Check the server console for any API key errors.
-   **Button Not Appearing**: Refresh the Amazon page. Ensure you are on a supported Amazon domain (.com or .in).
-   **No Summary**: Occasionally, Amazon's bot protection may block the scraper. Try again or wait a few moments.
