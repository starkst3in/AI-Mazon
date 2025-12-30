// CSS is injected via manifest.json

let activePlusButton = null;

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
        const target = event.target;
        const link = target.closest('a');

        if (link) {
            const href = link.href;
            // Check for standard product link OR sponsored link (/sspa/)
            if (href.includes('/dp/') || href.includes('/gp/product/') || href.includes('/sspa/')) {
                // Check if we are already showing a button for this link
                if (activePlusButton && activePlusButton.dataset.url === link.href) return;

                // Remove existing button if it's on a different element
                removePlusButton();

                createPlusButton(link);
            }
        }
    });
});


function createPlusButton(linkElement) {
    // Attempt to find a stable container
    let container = linkElement.closest('.s-result-item') || linkElement.closest('.a-carousel-card') || linkElement.closest('.zg-item-immersion') || linkElement.parentNode;

    if (container && getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    if (!container) return;

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
    activePlusButton = btn;
}

function removePlusButton() {
    // Persistent buttons as requested
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
            const images = response.summary.images || [];

            if (response.error) {
                body.innerHTML = `<div style="color:red">Error: ${response.error}</div>`;
                return;
            }

            // Construct HTML
            let contentHtml = '';

            // Carousel Section
            if (images.length > 0) {
                const showControls = images.length > 1;
                contentHtml += `
                    <div class="ai-mazon-carousel">
                        ${showControls ? `<button class="ai-mazon-carousel-btn prev" id="ai-mazon-prev">&lt;</button>` : ''}
                        <img src="${images[0]}" id="ai-mazon-img" data-index="0">
                        ${showControls ? `<button class="ai-mazon-carousel-btn next" id="ai-mazon-next">&gt;</button>` : ''}
                        ${showControls ? `<div style="position:absolute; bottom:5px; right:10px; font-size:10px; color:#555; background:rgba(255,255,255,0.8); padding:2px 5px; border-radius:3px;">1 / ${images.length}</div>` : ''}
                    </div>
                `;
            }

            contentHtml += `
                <h3>${s.product_name || "Product"}</h3>
                <p><strong>Price:</strong> ${s.price || "N/A"}</p>
                <p style="margin-bottom: 15px;">${s.summary || "No summary available."}</p>
            `;

            // Review Summary
            if (s.review_summary) {
                contentHtml += `
                    <div class="ai-mazon-review-summary">
                        <span class="ai-mazon-review-title">Review Summary</span>
                        ${s.review_summary}
                    </div>
                `;
            }

            if (s.pros_cons && s.pros_cons.pros && s.pros_cons.pros.length > 0) {
                contentHtml += ` <p><strong>Pros:</strong></p>
                <ul class="ai-mazon-pros">
                    ${s.pros_cons.pros.map(p => `<li>${p}</li>`).join('')}
                </ul>`;
            }

            if (s.pros_cons && s.pros_cons.cons && s.pros_cons.cons.length > 0) {
                contentHtml += ` <p><strong>Cons:</strong></p>
                <ul class="ai-mazon-cons">
                    ${s.pros_cons.cons.map(c => `<li>${c}</li>`).join('')}
                </ul>`;
            }

            contentHtml += `<p style="margin-top: 15px;"><strong>Verdict:</strong> ${s.verdict || ""}</p>`;

            body.innerHTML = contentHtml;

            // Carousel Logic
            if (images.length > 1) {
                let idx = 0;
                const imgEl = document.getElementById('ai-mazon-img');
                const nextBtn = document.getElementById('ai-mazon-next');
                const prevBtn = document.getElementById('ai-mazon-prev');

                const updateImg = () => {
                    if (imgEl) {
                        imgEl.src = images[idx];
                        imgEl.dataset.index = idx;
                    }
                };

                if (nextBtn) {
                    nextBtn.onclick = (e) => {
                        e.stopPropagation();
                        idx = (idx + 1) % images.length;
                        updateImg();
                    };
                }

                if (prevBtn) {
                    prevBtn.onclick = (e) => {
                        e.stopPropagation();
                        idx = (idx - 1 + images.length) % images.length;
                        updateImg();
                    };
                }
            }


        } else {
            body.innerHTML = `<div style="color:red">Error: ${response ? response.error : "Unknown error"}</div>`;
        }
    });
}
