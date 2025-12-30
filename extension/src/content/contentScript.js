// CSS is injected via manifest.json


let activePlusButton = null;
let currentTargetUrl = null;

// Helper to check if extension is enabled
function isExtensionEnabled(callback) {
    chrome.storage.local.get(['aiMazonEnabled'], (result) => {
        callback(result.aiMazonEnabled !== false);
    });
}

document.addEventListener('mouseover', (event) => {
    isExtensionEnabled((enabled) => {
        if (!enabled) return;

        // Simplified logic: finding common product card containers or links
        // Amazon selectors are notoriously messy. We'll look for <a> tags with hrefs containing /dp/ or /gp/product/
        const target = event.target;
        const link = target.closest('a');

        if (link && (link.href.includes('/dp/') || link.href.includes('/gp/product/'))) {
            // Check if we are already showing a button for this link
            if (activePlusButton && activePlusButton.dataset.url === link.href) return;

            // Remove existing button if it's on a different element
            removePlusButton();

            createPlusButton(link);
        }
    });
});

// We might want to remove the button if we mouse out of the card, 
// BUT the user said: "Once it appears, it should not disappear even if the cursor is out of the product card"
// So standard behavior is: it stays until we hover another product? 
// Or it accumulates? "Once it appears, it should not disappear".
// However, too many buttons would clutter. Let's make it disappear if we hover a DIFFERENT product, 
// but stay if we just move mouse away to empty space?
// Actually simpler: Let's attach it to the card.

function createPlusButton(linkElement) {
    // Find a relatively positioned parent or the card container
    // This is tricky on Amazon. Let's try to find a parent div that looks like a card.
    // Fallback: Use the link element itself if it's block-level, or its parent.

    // Attempt to find a stable container
    let container = linkElement.closest('.s-result-item') || linkElement.closest('.a-carousel-card') || linkElement.parentNode;

    // If container is inline, we might have positioning issues.
    // Let's create the button and position it absolute relative to the container.
    // Ensure container is relative

    // Visual fix: Many amazon links are just text. We want the IMAGE or the main CARD.
    // The user said "Amazon product card".

    // Let's try to position it top-right of the container.
    // To avoid messing up layout, we might just append it to body and use getBoundingClientRect, 
    // but that drifts on scroll.
    // Better to append to container and set container to relative (if not already).

    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    // Check if button already exists in this container
    if (container.querySelector('.ai-mazon-plus')) return;

    const btn = document.createElement('div');
    btn.className = 'ai-mazon-plus';
    btn.innerHTML = '+';
    btn.dataset.url = linkElement.href;

    // Add event listener
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSummary(linkElement.href);
    });

    container.appendChild(btn);
    activePlusButton = btn; // Track valid button
}

function removePlusButton() {
    // If we want single button behavior:
    // if (activePlusButton) {
    //    activePlusButton.remove();
    //    activePlusButton = null;
    // }

    // User asked "Once it appears, it should not disappear even if the cursor is out".
    // This implies persistent buttons for visited cards.
    // So we DON'T remove.
}

function openSummary(url) {
    // Create Modal
    const overlay = document.createElement('div');
    overlay.className = 'ai-mazon-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ai-mazon-modal';

    modal.innerHTML = `
        <div class="ai-mazon-header">
            <h2>AI-Mazon Summary</h2>
            <span class="ai-mazon-close">&times;</span>
        </div>
        <div class="ai-mazon-body">
            <div class="ai-mazon-loading">Loading summary...<br>Please wait...</div>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close logic
    const closeBtn = modal.querySelector('.ai-mazon-close');
    const close = () => document.body.removeChild(overlay);
    closeBtn.onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    // Fetch Summary
    chrome.runtime.sendMessage({ action: "summarize", url: url }, (response) => {
        const body = modal.querySelector('.ai-mazon-body');
        if (response && response.summary) {
            const s = response.summary;

            if (response.error) {
                body.innerHTML = `<div style="color:red">Error: ${response.error}</div>`;
                return;
            }

            body.innerHTML = `
                <h3>${s.product_name || "Product"}</h3>
                <p><strong>Price:</strong> ${s.price || "N/A"}</p>
                <p>${s.summary || "No summary available."}</p>
                
                ${s.pros_cons && s.pros_cons.pros && s.pros_cons.pros.length > 0 ? `
                <p><strong>Pros:</strong></p>
                <ul class="ai-mazon-pros">
                    ${s.pros_cons.pros.map(p => `<li>${p}</li>`).join('')}
                </ul>` : ''}

                ${s.pros_cons && s.pros_cons.cons && s.pros_cons.cons.length > 0 ? `
                <p><strong>Cons:</strong></p>
                <ul class="ai-mazon-cons">
                    ${s.pros_cons.cons.map(c => `<li>${c}</li>`).join('')}
                </ul>` : ''}

                <p><strong>Verdict:</strong> ${s.verdict || ""}</p>
            `;
        } else {
            body.innerHTML = `<div style="color:red">Error: ${response ? response.error : "Unknown error"}</div>`;
        }
    });
}
