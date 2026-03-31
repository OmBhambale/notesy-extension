async function exportToDOCX(htmlContent, customFilename) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = window.docx;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const docChildren = [
        new Paragraph({
            text: customFilename || "Study Notes",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Generated on: ${new Date().toLocaleString()}`,
                    italics: true,
                    color: "636E72",
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    ];

    /**
     * Accumulates styles from parent nodes and applies them to text runs at the leaves.
     */
    function parseNode(node, currentStyles = {}) {
        if (node.nodeType === 3) { // Text node
            const text = node.textContent;
            if (!text.trim() && text !== ' ') return [];
            return [new TextRun({
                text: text,
                ...currentStyles
            })];
        }

        if (node.nodeType !== 1) return []; // Skip non-element nodes

        const tagName = node.tagName.toLowerCase();
        const newStyles = { ...currentStyles };

        if (tagName === 'b' || tagName === 'strong') newStyles.bold = true;
        if (tagName === 'i' || tagName === 'em') newStyles.italics = true;
        if (tagName === 'u') newStyles.underline = {};
        if (tagName === 'font' && node.getAttribute('face') === 'monospace') {
            newStyles.font = "Courier New";
        }

        const runs = [];
        node.childNodes.forEach(child => {
            runs.push(...parseNode(child, newStyles));
        });
        return runs;
    }

    tempDiv.childNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        const tagName = node.tagName.toLowerCase();
        
        if (tagName === 'h4') {
            docChildren.push(new Paragraph({
                text: node.innerText,
                heading: HeadingLevel.HEADING_4,
                spacing: { before: 200, after: 100 }
            }));
        } else if (tagName === 'blockquote') {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: node.innerText, italics: true, color: "636E72" })],
                indent: { left: 720 }, // 0.5 inch
                spacing: { before: 100, after: 100 }
            }));
        } else if (tagName === 'pre') {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: node.innerText, font: "Courier New" })],
                spacing: { before: 100, after: 100 }
            }));
        } else if (tagName === 'ul' || tagName === 'ol') {
            node.childNodes.forEach(li => {
                if (li.nodeType === 1 && li.tagName.toLowerCase() === 'li') {
                    docChildren.push(new Paragraph({
                        children: parseNode(li),
                        bullet: tagName === 'ul' ? { level: 0 } : undefined,
                        // Numbering in docx.js requires a separate numbering configuration. 
                        // For simplicity in this lightweight build, we treat ol as bulleted or plain.
                    }));
                }
            });
        } else if (node.innerText?.trim()) {
            docChildren.push(new Paragraph({
                children: parseNode(node)
            }));
        }
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren,
        }],
    });

    const blob = await Packer.toBlob(doc);
    let filename = customFilename ? (customFilename.endsWith('.docx') ? customFilename : `${customFilename}.docx`) : `StudyNotes_${new Date().toISOString().slice(0, 10)}.docx`;
    saveAs(blob, filename);
}
