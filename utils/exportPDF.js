function exportToPDF(htmlContent, customFilename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let y = 40; 
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const maxLineWidth = pageWidth - margin * 2;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 7;
    const codeLineHeight = 4.8;

    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    const headerTitle = customFilename || "Study Notes";
    doc.text(headerTitle, (pageWidth / 2), 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 28);
    doc.line(margin, 32, pageWidth - margin, 32);

    function addWrappedText(text, fontSize, color, isBold = false, isMonospace = false, alignment = 'left', preserveWhitespace = false) {
        if (text === undefined || text === null) return;
        
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont(isMonospace ? "courier" : "helvetica", isBold ? "bold" : "normal");

        const currentLineHeight = isMonospace ? codeLineHeight : lineHeight;
        
        // Robust split: Handle both real newlines and escaped versions
        const manualLines = text.toString().split(/\r?\n/);
        
        manualLines.forEach(mLine => {
            // Do NOT trim if preserving whitespace (crucial for code indentation)
            const processedLine = preserveWhitespace ? mLine : mLine.trim();
            
            if (processedLine === "" && manualLines.length > 1) {
                y += currentLineHeight;
                return;
            } else if (processedLine === "" && !preserveWhitespace) {
                return;
            }

            const lines = doc.splitTextToSize(processedLine, maxLineWidth);
            lines.forEach(line => {
                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = 20;
                }
                const x = alignment === 'center' ? (pageWidth / 2) : (alignment === 'right' ? (pageWidth - margin) : margin);
                doc.text(line, x, y, { align: alignment });
                y += currentLineHeight;
            });
        });
    }

    function processImage(imgNode) {
        const src = imgNode.getAttribute('src');
        if (src && src.startsWith('data:image')) {
            const formatMatch = src.match(/^data:image\/(png|jpg|jpeg|webp);base64,/);
            const format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
            let imgWidth = 100; 
            let imgHeight = (imgNode.naturalHeight / imgNode.naturalWidth) * imgWidth || 75;
            if (y + imgHeight > pageHeight - margin) { doc.addPage(); y = 20; }
            try {
                const centerX = (pageWidth - imgWidth) / 2;
                doc.addImage(src, format === 'WEBP' ? 'JPEG' : format, centerX, y, imgWidth, imgHeight);
                y += imgHeight + 8;
            } catch (e) { console.error("PDF Image Error:", e); }
        }
    }

    function walk(node, inPre = false) {
        if (node.nodeType === 3) {
            const text = inPre ? node.textContent : node.textContent.trim();
            if (text) addWrappedText(text, 11, [45, 52, 54], false, inPre, 'left', inPre);
            return;
        }
        if (node.nodeType !== 1) return;

        const tagName = node.tagName.toLowerCase();
        const alignment = node.style.textAlign || 'left';

        switch(tagName) {
            case 'h4':
                y += 2; addWrappedText(node.innerText, 14, [79, 70, 229], true, false, alignment); y += 2;
                break;
            case 'blockquote':
                addWrappedText(node.innerText, 11, [100, 116, 139], false, false, alignment); y += 2;
                break;
            case 'pre':
                y += 2;
                // Use robust HTML-to-Text conversion for code blocks
                let codeText = node.innerHTML
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/p>|<\/div>/gi, '\n')
                    .replace(/<[^>]+>/g, '');
                
                // Decode HTML entities (like &nbsp; for indentation)
                const decoder = document.createElement('textarea');
                decoder.innerHTML = codeText;
                codeText = decoder.value;

                addWrappedText(codeText, 10, [45, 52, 54], false, true, 'left', true);
                y += 2;
                break;
            case 'img':
                processImage(node);
                break;
            case 'ul':
            case 'ol':
                Array.from(node.childNodes).forEach((li, idx) => {
                    if (li.nodeType === 1 && li.tagName.toLowerCase() === 'li') {
                        const prefix = tagName === 'ul' ? "• " : `${idx + 1}. `;
                        addWrappedText(prefix + li.innerText.trim(), 11, [45, 52, 54], false, false, alignment);
                    }
                });
                y += 2;
                break;
            case 'br':
                y += lineHeight;
                break;
            case 'div':
            case 'p':
                if (node.querySelector('pre')) {
                    Array.from(node.childNodes).forEach(child => walk(child, inPre));
                } else if (node.querySelector('img') || node.querySelector('ul, ol')) {
                    Array.from(node.childNodes).forEach(child => walk(child, inPre));
                } else {
                    addWrappedText(node.innerText, 11, [45, 52, 54], false, false, alignment);
                }
                break;
            default:
                Array.from(node.childNodes).forEach(child => walk(child, inPre));
        }
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    Array.from(tempDiv.childNodes).forEach(node => walk(node));
    
    let filename = customFilename ? (customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`) : `StudyNotes_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
}
