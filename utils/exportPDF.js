function exportToPDF(htmlContent, customFilename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const maxLineWidth = pageWidth - margin * 2;
    const pageHeight = doc.internal.pageSize.height;
    
    // Set Header/Title
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // Indigo accent
    const headerTitle = customFilename || "Study Notes";
    doc.text(headerTitle, margin, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 28);
    
    // Add separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 32, pageWidth - margin, 32);
    
    let y = 40;
    const lineHeight = 7;

    // Helper to add text with page-break support
    function addWrappedText(text, fontSize, color, isBold = false) {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("helvetica", isBold ? "bold" : "normal");

        const lines = doc.splitTextToSize(text, maxLineWidth);
        lines.forEach(line => {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, margin, y);
            y += lineHeight;
        });
    }

    // Parse the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    tempDiv.childNodes.forEach(node => {
        if (node.nodeType === 3) { // Text node
            const text = node.textContent.trim();
            if (text) addWrappedText(text, 11, [45, 52, 54]);
        } else if (node.nodeType === 1) { // Element node
            const tagName = node.tagName.toLowerCase();
            const text = node.innerText.trim();
            if (!text) return;

            switch(tagName) {
                case 'h4':
                    y += 3; // Extra spacing
                    addWrappedText(text, 14, [79, 70, 229], true);
                    y += 2;
                    break;
                case 'blockquote':
                    doc.setDrawColor(79, 70, 229);
                    doc.setLineWidth(0.5);
                    doc.line(margin, y - 4, margin, y + 2); // Simple quote bar
                    addWrappedText("    " + text, 11, [100, 116, 139], false);
                    break;
                case 'pre':
                    addWrappedText(text, 10, [45, 52, 54], false);
                    break;
                case 'ul':
                case 'ol':
                    const items = node.querySelectorAll('li');
                    items.forEach((li, index) => {
                        const prefix = tagName === 'ul' ? "• " : `${index + 1}. `;
                        addWrappedText(prefix + li.innerText, 11, [45, 52, 54]);
                    });
                    break;
                case 'div':
                case 'p':
                    addWrappedText(text, 11, [45, 52, 54]);
                    break;
                default:
                    addWrappedText(text, 11, [45, 52, 54]);
            }
        }
    });
    
    // Filename logic
    let filename = "";
    if (customFilename) {
        filename = customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`;
    } else {
        const now = new Date();
        filename = `StudyNotes_${now.toISOString().slice(0, 10)}.pdf`;
    }
    
    doc.save(filename);
}
