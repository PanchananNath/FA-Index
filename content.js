let globalFirstAuthorPapers = [];
let globalProfileName = "";
let isProcessing = false;

// --- 1. Robust First-Author Matching Engine ---
function normalizeText(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Strip diacritics/accents
        .toLowerCase();
}

function isFirstAuthor(profileName, authorsString) {
    if (!authorsString) return false;

    // Split by comma to isolate the first author
    const authors = authorsString.split(',');
    if (authors.length === 0) return false;

    // Clean first author name
    let firstAuthor = normalizeText(authors[0]).replace(/\.\.\.$/, '').trim();

    // Clean profile owner's name
    let cleanProfile = normalizeText(profileName)
        .replace(/^(dr\.|prof\.|mr\.|ms\.|mrs\.)\s+/i, '')
        .trim();

    const profileTokens = cleanProfile.split(/\s+/).filter(t => t.length > 0);
    if (profileTokens.length === 0) return false;

    const lastName = profileTokens[profileTokens.length - 1];
    const firstName = profileTokens[0];
    const firstInitial = firstName.charAt(0);

    const cleanFA = firstAuthor.replace(/[^\w\s]/g, ' ');
    const faTokens = cleanFA.split(/\s+/).filter(t => t.length > 0);

    // Step A: First author MUST contain the exact last name
    const hasLastName = faTokens.some(token => token === lastName);
    if (!hasLastName) return false;

    // Step B: Remaining tokens must match first initial or full first name
    const otherTokens = faTokens.filter(token => token !== lastName);
    if (otherTokens.length === 0) return true;

    return otherTokens.some(token => 
        token.charAt(0) === firstInitial || token === firstName
    );
}

// --- 2. CSV Helper ---
function escapeCSV(field) {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
}

function downloadCSV() {
    if (!globalFirstAuthorPapers || globalFirstAuthorPapers.length === 0) {
        alert("No first-author papers found among loaded papers.");
        return;
    }

    const headers = ["Title", "Authors", "Citations", "Year", "URL"];
    let csvRows = [headers.map(escapeCSV).join(",")];

    globalFirstAuthorPapers.forEach(paper => {
        csvRows.push([
            paper.title,
            paper.authors,
            paper.citations,
            paper.year,
            paper.url
        ].map(escapeCSV).join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const filename = `${globalProfileName.replace(/\s+/g, '_')}_First_Author_Papers.csv`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- 3. Sidebar UI Injection ---
function injectSidebarUI(totalLoaded, faCount, faCitations, faIndex) {
    const statsTable = document.getElementById('gsc_rsb_st');
    if (!statsTable) return;

    // Remove previous elements to update
    document.querySelectorAll('.fa-stats-row').forEach(row => row.remove());
    document.querySelectorAll('#fa-controls-container').forEach(el => el.remove());

    const tbody = statsTable.querySelector('tbody');
    if (!tbody) return;

    const createRow = (label, value) => {
        const tr = document.createElement('tr');
        tr.className = 'fa-stats-row';
        tr.innerHTML = `
            <td class="gsc_rsb_sc1"><a class="gsc_rsb_f gs_ibl">${label}</a></td>
            <td class="gsc_rsb_std">${value}</td>
            <td class="gsc_rsb_std"></td>
        `;
        return tr;
    };

    tbody.appendChild(createRow('FA-Papers', faCount.toLocaleString()));
    tbody.appendChild(createRow('FA-Citations', faCitations.toLocaleString()));
    tbody.appendChild(createRow('FA-Index', faIndex));

    // Action Control Box
    const btnContainer = document.createElement('div');
    btnContainer.id = 'fa-controls-container';
    btnContainer.innerHTML = `
        <div style="font-size: 11px; color: #5f6368; margin-top: 8px; margin-bottom: 6px; text-align: center;">
            Scanned <b>${totalLoaded.toLocaleString()}</b> loaded papers in DOM
        </div>
        <button id="fa-refresh-btn" class="fa-btn fa-refresh-btn">
             Sync / Refresh Metrics
        </button>
        <button id="fa-csv-btn" class="fa-btn fa-csv-btn">
             Export First-Author CSV (${faCount})
        </button>
    `;

    statsTable.parentNode.insertBefore(btnContainer, statsTable.nextSibling);

    document.getElementById('fa-refresh-btn').addEventListener('click', () => {
        scanAndHighlightAllLoadedPapers();
    });

    document.getElementById('fa-csv-btn').addEventListener('click', downloadCSV);
}

// --- 4. Core DOM Scanner & Highlighter ---
function scanAndHighlightAllLoadedPapers() {
    if (isProcessing) return;
    isProcessing = true;

    const profileNameEl = document.getElementById('gsc_prf_in');
    if (!profileNameEl) {
        isProcessing = false;
        return;
    }
    globalProfileName = profileNameEl.innerText.trim();

    const rows = document.querySelectorAll('tr.gsc_a_tr');
    globalFirstAuthorPapers = [];

    let faPaperCount = 0;
    let faCitationCount = 0;
    let faCitationsArray = [];

    rows.forEach(row => {
        // Get the author list element (first gs_gray div)
        const authorsEl = row.querySelector('td.gsc_a_t div.gs_gray');
        if (!authorsEl) return;

        const authorsText = authorsEl.innerText.trim();
        const titleEl = row.querySelector('.gsc_a_at');

        if (isFirstAuthor(globalProfileName, authorsText)) {
            faPaperCount++;

            // Highlight title & row
            if (titleEl) {
                titleEl.classList.add('first-author-title');
            }
            row.classList.add('first-author-highlight');

            // Extract paper details
            const title = titleEl ? titleEl.innerText.trim() : "Untitled";
            const relativeUrl = titleEl ? titleEl.getAttribute('href') : "";
            const fullUrl = relativeUrl ? `https://scholar.google.com${relativeUrl}` : "";

            const yearEl = row.querySelector('td.gsc_a_y span');
            const year = yearEl ? yearEl.innerText.trim() : "";

            const citeEl = row.querySelector('.gsc_a_ac');
            let cites = 0;
            if (citeEl && citeEl.innerText) {
                cites = parseInt(citeEl.innerText, 10);
                if (isNaN(cites)) cites = 0;
            }

            faCitationCount += cites;
            faCitationsArray.push(cites);

            globalFirstAuthorPapers.push({
                title: title,
                authors: authorsText,
                citations: cites,
                year: year,
                url: fullUrl
            });
        } else {
            // Remove highlight if not a first-author paper
            if (titleEl) titleEl.classList.remove('first-author-title');
            row.classList.remove('first-author-highlight');
        }
    });

    // Compute FA-Index
    faCitationsArray.sort((a, b) => b - a);
    let faIndex = 0;
    for (let i = 0; i < faCitationsArray.length; i++) {
        if (faCitationsArray[i] >= i + 1) {
            faIndex = i + 1;
        } else {
            break;
        }
    }

    injectSidebarUI(rows.length, faPaperCount, faCitationCount, faIndex);
    isProcessing = false;
}

// --- 5. DOM Mutation Observer for Automatic Sync ---
let debounceTimer;
function setupDOMObserver() {
    scanAndHighlightAllLoadedPapers();

    const tableBody = document.getElementById('gsc_a_b');
    if (!tableBody) return;

    const observer = new MutationObserver((mutations) => {
        let addedRows = false;
        mutations.forEach(m => {
            if (m.addedNodes.length > 0) addedRows = true;
        });

        if (addedRows) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                scanAndHighlightAllLoadedPapers();
            }, 150);
        }
    });

    observer.observe(tableBody, { childList: true });
}

// Execute on DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDOMObserver);
} else {
    setupDOMObserver();
}