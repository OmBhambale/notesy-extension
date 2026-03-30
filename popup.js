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
            notesArea.value = result.notes;
            updateWordCount(result.notes);
        }
        if (result.darkMode) {
            document.body.classList.add('dark-mode');
        }
        if (result.lastFilename) {
            filenameInput.value = result.lastFilename;
        }
    });

    // Auto-save logic (Debounced)
    notesArea.addEventListener('input', () => {
        const content = notesArea.value;
        updateWordCount(content);
        
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
            notesArea.value = '';
            updateWordCount('');
            saveNotes('');
        }
    });

    // Insert Timestamp
    timestampBtn.addEventListener('click', () => {
        const now = new Date();
        const timestamp = `\n[${now.toLocaleString()}]\n`;
        const start = notesArea.selectionStart;
        const end = notesArea.selectionEnd;
        const text = notesArea.value;
        
        notesArea.value = text.substring(0, start) + timestamp + text.substring(end);
        notesArea.focus();
        notesArea.selectionStart = notesArea.selectionEnd = start + timestamp.length;
        
        saveNotes(notesArea.value);
    });

    // Export PDF
    downloadPdfBtn.addEventListener('click', () => {
        const content = notesArea.value;
        const filename = filenameInput.value.trim();
        if (!content.trim()) return alert('Nothing to export!');
        
        if (typeof exportToPDF === 'function') {
            exportToPDF(content, filename);
        } else {
            console.error('PDF export utility not loaded');
        }
    });

    // Export DOCX
    downloadDocxBtn.addEventListener('click', () => {
        const content = notesArea.value;
        const filename = filenameInput.value.trim();
        if (!content.trim()) return alert('Nothing to export!');
        
        if (typeof exportToDOCX === 'function') {
            exportToDOCX(content, filename);
        } else {
            console.error('DOCX export utility not loaded');
        }
    });
});
