document.addEventListener('DOMContentLoaded', () => {
    const notesArea = document.getElementById('notes-area');
    const wordCountDisplay = document.getElementById('word-count');
    const saveStatus = document.getElementById('save-status');
    const themeToggle = document.getElementById('theme-toggle');
    const clearBtn = document.getElementById('clear-notes');
    const timestampBtn = document.getElementById('insert-timestamp');
    const downloadPdfBtn = document.getElementById('download-pdf');
    const downloadDocxBtn = document.getElementById('download-docx');
    const filenameInput = document.getElementById('filename-input');

    let autoSaveTimeout;

    // Load saved notes, theme, and last used filename
    chrome.storage.local.get(['notes', 'darkMode', 'lastFilename'], (result) => {
        if (result.notes) {
            notesArea.innerHTML = result.notes;
            updateWordCount(notesArea.innerText);
        }
        if (result.darkMode) {
            document.body.classList.add('dark-mode');
        }
        if (result.lastFilename) {
            filenameInput.value = result.lastFilename;
        }
    });

    // Formatting Commands
    document.querySelectorAll('.format-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.getAttribute('data-command');
            const value = btn.getAttribute('data-value') || null;
            document.execCommand(command, false, value);
            notesArea.focus();
        });
    });

    document.getElementById('format-block').addEventListener('change', (e) => {
        document.execCommand('formatBlock', false, e.target.value);
        notesArea.focus();
    });

    // Auto-save logic (Debounced)
    notesArea.addEventListener('input', () => {
        const content = notesArea.innerHTML;
        updateWordCount(notesArea.innerText);
        
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveNotes(content);
        }, 2000); // 2-second debounce
    });

    // Save filename on change
    filenameInput.addEventListener('input', () => {
        chrome.storage.local.set({ lastFilename: filenameInput.value });
    });

    function saveNotes(content) {
        chrome.storage.local.set({ notes: content }, () => {
            showStatus();
        });
    }

    function showStatus() {
        saveStatus.classList.remove('hide');
        setTimeout(() => {
            saveStatus.classList.add('hide');
        }, 1500);
    }

    function updateWordCount(text) {
        const count = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordCountDisplay.textContent = `${count} word${count === 1 ? '' : 's'}`;
    }

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        chrome.storage.local.set({ darkMode: isDark });
    });

    // Clear Notes
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all notes? This cannot be undone.')) {
            notesArea.innerHTML = '';
            updateWordCount('');
            saveNotes('');
        }
    });

    // Insert Timestamp
    timestampBtn.addEventListener('click', () => {
        const now = new Date();
        const timestamp = `[${now.toLocaleString()}] `;
        document.execCommand('insertText', false, timestamp);
        notesArea.focus();
    });

    // Export PDF
    downloadPdfBtn.addEventListener('click', () => {
        const content = notesArea.innerHTML;
        const plainText = notesArea.innerText;
        const filename = filenameInput.value.trim();
        if (!plainText.trim()) return alert('Nothing to export!');
        
        if (typeof exportToPDF === 'function') {
            exportToPDF(content, filename); // Passing HTML to PDF utility
        } else {
            console.error('PDF export utility not loaded');
        }
    });

    // Export DOCX
    downloadDocxBtn.addEventListener('click', () => {
        const content = notesArea.innerHTML;
        const plainText = notesArea.innerText;
        const filename = filenameInput.value.trim();
        if (!plainText.trim()) return alert('Nothing to export!');
        
        if (typeof exportToDOCX === 'function') {
            exportToDOCX(content, filename); // Passing HTML to DOCX utility
        } else {
            console.error('DOCX export utility not loaded');
        }
    });
});
