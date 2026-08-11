/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';

interface PDFData {
  title: string;
  subtitle: string;
  summary?: string;
  keyPoints?: string[];
  formulas?: string[];
  definitions?: string[]; // array of "term: definition"
  extraText?: { label: string; content: string }[];
}

export function exportToPDF(data: PDFData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Helper to check for page overflow
  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
  };

  // Helper to draw clean header and brand lines on each page
  const drawHeader = () => {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 64); // StudyFlow Brand Sage: #5A5A40
    doc.text("STUDYFLOW AI REVISION SUITE", margin, margin - 10);
    
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(new Date().toLocaleDateString(), pageWidth - margin - 20, margin - 10);

    // Decorative line
    doc.setDrawColor(212, 163, 115); // Brand Sand: #D4A373
    doc.setLineWidth(0.5);
    doc.line(margin, margin - 8, pageWidth - margin, margin - 8);
  };

  // Setup first page header
  drawHeader();

  // Document Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  const splitTitle = doc.splitTextToSize(data.title, contentWidth);
  const titleHeight = splitTitle.length * 8;
  doc.text(splitTitle, margin, y);
  y += titleHeight + 4;

  // Subtitle
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(data.subtitle, margin, y);
  y += 12;

  // Section line
  doc.setDrawColor(230, 230, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 4, pageWidth - margin, y - 4);

  // Overview Summary Section
  if (data.summary) {
    checkPageOverflow(40);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(90, 90, 64);
    doc.text("I. OVERVIEW & CHAPTER SUMMARY", margin, y);
    y += 8;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitSummary = doc.splitTextToSize(data.summary, contentWidth);
    const summaryHeight = splitSummary.length * 5;
    checkPageOverflow(summaryHeight);
    doc.text(splitSummary, margin, y);
    y += summaryHeight + 12;
  }

  // Key Points Section
  if (data.keyPoints && data.keyPoints.length > 0) {
    checkPageOverflow(30);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(90, 90, 64);
    doc.text("II. KEY INSIGHTS & POINT NOTES", margin, y);
    y += 8;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    data.keyPoints.forEach((pt) => {
      const splitPt = doc.splitTextToSize(`•  ${pt}`, contentWidth - 5);
      const ptHeight = splitPt.length * 5 + 2;
      checkPageOverflow(ptHeight);
      doc.text(splitPt, margin + 2, y);
      y += ptHeight;
    });
    y += 8;
  }

  // Important Formulas Section
  if (data.formulas && data.formulas.length > 0) {
    checkPageOverflow(30);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(90, 90, 64);
    doc.text("III. CRITICAL FORMULAS & EQUATIONS", margin, y);
    y += 8;

    doc.setFont("Courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 64);

    data.formulas.forEach((formula) => {
      const splitFormula = doc.splitTextToSize(`[Eq]  ${formula}`, contentWidth - 10);
      const formulaHeight = splitFormula.length * 5 + 4;
      checkPageOverflow(formulaHeight);
      
      // Draw a light grey background box
      doc.setFillColor(248, 247, 243);
      doc.rect(margin, y - 3, contentWidth, formulaHeight - 2, "F");
      
      doc.text(splitFormula, margin + 4, y + 1);
      y += formulaHeight;
    });
    y += 8;
  }

  // Jargon & Glossary definitions
  if (data.definitions && data.definitions.length > 0) {
    checkPageOverflow(30);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(90, 90, 64);
    doc.text("IV. CORE GLOSSARY & DEFINITIONS", margin, y);
    y += 8;

    data.definitions.forEach((def) => {
      const splitIdx = def.indexOf(':');
      const term = splitIdx !== -1 ? def.substring(0, splitIdx).trim() : "Concept";
      const definition = splitIdx !== -1 ? def.substring(splitIdx + 1).trim() : def.trim();

      const termWithColon = `${term}:`;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const splitTerm = doc.splitTextToSize(termWithColon, 45);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const splitDef = doc.splitTextToSize(definition, contentWidth - 50);

      const neededHeight = Math.max(splitTerm.length, splitDef.length) * 5 + 2;
      checkPageOverflow(neededHeight);

      // Draw term
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(45, 45, 45);
      doc.text(termWithColon, margin, y);

      // Draw definition
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(splitDef, margin + 45, y);

      y += neededHeight;
    });
    y += 8;
  }

  // Extra text e.g. Revision Notes or Mind Map outline
  if (data.extraText && data.extraText.length > 0) {
    data.extraText.forEach((sec) => {
      checkPageOverflow(30);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(90, 90, 64);
      doc.text(sec.label.toUpperCase(), margin, y);
      y += 8;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      const splitSecContent = doc.splitTextToSize(sec.content, contentWidth);
      const secContentHeight = splitSecContent.length * 4.5 + 4;
      checkPageOverflow(secContentHeight);

      doc.text(splitSecContent, margin, y);
      y += secContentHeight + 8;
    });
  }

  // Save the document
  const safeTitle = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  doc.save(`${safeTitle}_study_packet.pdf`);
}
