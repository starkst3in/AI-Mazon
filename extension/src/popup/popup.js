document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleExtension');
    const statusDiv = document.getElementById('status');

    // Load saved state
    chrome.storage.local.get(['aiMazonEnabled'], (result) => {
        // Default to true if not set
        const isEnabled = result.aiMazonEnabled !== false;
        toggle.checked = isEnabled;
        updateStatusText(isEnabled);
    });

    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;
        chrome.storage.local.set({ aiMazonEnabled: isEnabled }, () => {
            updateStatusText(isEnabled);
        });
    });

    function updateStatusText(enabled) {
        statusDiv.textContent = enabled ? 'Active' : 'Disabled';
        statusDiv.style.color = enabled ? 'green' : 'red';
    }
});
