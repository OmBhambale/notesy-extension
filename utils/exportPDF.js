function exportToPDF(content, customFilename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const maxLineWidth = pageWidth - margin * 2;
    
    // Set Header
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
    
    // Set Content
    doc.setFontSize(11);
    doc.setTextColor(45, 52, 54);
    
    // Simple text wrapping logic
    const lines = doc.splitTextToSize(content, maxLineWidth);
    
    let y = 40;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    
    lines.forEach(line => {
        if (y > pageHeight - margin) {
            doc.addPage();
            y = 20;
        }
        doc.text(line, margin, y);
        y += lineHeight;
    });
    
    // Filename logic
    let filename = "";
    if (customFilename) {
        filename = customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`;
    } else {
        const now = new Date();
        filename = `StudyNotes_${now.toISOString().slice(0, 10)}_${now.getHours()}-${now.getMinutes()}.pdf`;
    }
    
    doc.save(filename);
}
