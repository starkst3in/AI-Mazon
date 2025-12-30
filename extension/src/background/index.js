chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarize") {
        // Check if extension is enabled
        chrome.storage.local.get(['aiMazonEnabled'], (result) => {
            if (result.aiMazonEnabled === false) {
                sendResponse({ error: "Extension is disabled" });
                return;
            }

            console.log("Summarizing URL:", request.url);
            fetch('http://127.0.0.1:5000/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: request.url })
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Server response:", data);
                    sendResponse(data);
                })
                .catch(error => {
                    console.error("Fetch error:", error);
                    sendResponse({ error: "Failed to connect to AI-Mazon Server. Please ensure 'python server/main.py' is running." });
                });
        });

        return true; // Keep channel open for async response
    }
});
