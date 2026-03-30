async function exportToDOCX(content, customFilename) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = window.docx;

    const paragraphs = content.split('\n').map(line => {
        return new Paragraph({
            children: [
                new TextRun({
                    text: line,
                    size: 24, // 12pt
                    font: "Calibri",
                })
            ],
            spacing: {
                after: 100,
            }
        });
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
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
                }),
                ...paragraphs
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    
    // Filename logic
    let filename = "";
    if (customFilename) {
        filename = customFilename.endsWith('.docx') ? customFilename : `${customFilename}.docx`;
    } else {
        const now = new Date();
        filename = `StudyNotes_${now.toISOString().slice(0, 10)}_${now.getHours()}-${now.getMinutes()}.docx`;
    }
    
    saveAs(blob, filename);
}
