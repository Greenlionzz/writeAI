import { jsPDF } from 'jspdf';
import { Project, Book, Act, Chapter, Scene } from '../types/writing';

export interface PDFExportProgress {
  percent: number;
  stage: string;
  detail?: string;
}

export interface PDFExportOptions {
  scope: 'all' | 'current-book';
  bookId?: string;
  pageSize?: 'letter' | 'a4';
  fontStyle?: 'times' | 'helvetica';
  includeTitlePage?: boolean;
  includeToc?: boolean;
  includeSynopsis?: boolean;
  includePageNumbers?: boolean;
  includeRunningHeaders?: boolean;
  onProgress?: (progress: PDFExportProgress) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function exportProjectPDF(
  project: Project,
  options: Partial<PDFExportOptions> = {}
): Promise<void> {
  const {
    scope = 'all',
    bookId,
    pageSize = 'letter',
    fontStyle = 'times',
    includeTitlePage = true,
    includeToc = true,
    includeSynopsis = true,
    includePageNumbers = true,
    includeRunningHeaders = true,
    onProgress,
  } = options;

  onProgress?.({
    percent: 5,
    stage: 'Initializing PDF document layout...',
    detail: `Paper size: ${pageSize.toUpperCase()} · Font: ${fontStyle === 'times' ? 'Classic Serif' : 'Modern Sans'}`,
  });
  await sleep(60);

  // Initialize jsPDF instance
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 22; // 22mm left & right margins
  const marginTop = 25;
  const marginBottom = 22;
  const contentWidth = pageWidth - marginX * 2;
  const maxContentY = pageHeight - marginBottom;

  let currentY = marginTop;

  // Fonts
  const primaryFont = fontStyle === 'times' ? 'times' : 'helvetica';

  // Determine books to include
  const targetBooks: Book[] =
    scope === 'current-book' && bookId
      ? project.books.filter((b) => b.id === bookId)
      : project.books.length > 0
      ? project.books
      : [];

  // Count total chapters to calculate precise progress
  let totalChaptersCount = 0;
  targetBooks.forEach((b) => {
    b.acts?.forEach((a) => {
      totalChaptersCount += a.chapters?.length || 0;
    });
  });
  totalChaptersCount = Math.max(1, totalChaptersCount);

  // Helper: check space or add page
  const ensureSpace = (requiredHeightMm: number) => {
    if (currentY + requiredHeightMm > maxContentY) {
      doc.addPage();
      currentY = marginTop;
    }
  };

  // Helper: clean markdown syntax for clean book reading
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/^#+\s+/gm, '') // Remove heading hashes
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/~~(.*?)~~/g, '$1') // Strikethrough
      .replace(/<u>(.*?)<\/u>/g, '$1') // Underline
      .replace(/^>\s+/gm, '') // Blockquote
      .trim();
  };

  // ==========================================
  // 1. TITLE PAGE
  // ==========================================
  if (includeTitlePage) {
    onProgress?.({
      percent: 15,
      stage: 'Formatting title page & book metadata...',
      detail: `"${project.title}" by ${project.author}`,
    });
    await sleep(70);

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(26);

    // Title centered vertically in upper-middle
    currentY = 75;
    const titleLines = doc.splitTextToSize(project.title, contentWidth);
    doc.text(titleLines, pageWidth / 2, currentY, { align: 'center' });
    currentY += titleLines.length * 11;

    // Subtitle if available
    if (project.subtitle) {
      doc.setFont(primaryFont, 'italic');
      doc.setFontSize(14);
      doc.setTextColor(80, 80, 80);
      const subLines = doc.splitTextToSize(project.subtitle, contentWidth);
      doc.text(subLines, pageWidth / 2, currentY, { align: 'center' });
      currentY += subLines.length * 7 + 8;
    } else {
      currentY += 12;
    }

    // Author
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(`By ${project.author}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 18;

    // Decorative line
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 25, currentY, pageWidth / 2 + 25, currentY);
    currentY += 16;

    // Volume / Genre pill text
    doc.setFont(primaryFont, 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(110, 110, 110);
    const metaText = `${project.genre} · ${project.format} · ~${project.targetWordCount?.toLocaleString() || '80,000'} words`;
    doc.text(metaText, pageWidth / 2, currentY, { align: 'center' });
    currentY += 18;

    // Synopsis block on title page if selected
    if (includeSynopsis && project.synopsis) {
      doc.setFont(primaryFont, 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(90, 90, 90);
      const synopsisLines = doc.splitTextToSize(
        `"${project.synopsis.slice(0, 320)}${project.synopsis.length > 320 ? '...' : ''}"`,
        contentWidth - 20
      );
      doc.text(synopsisLines, pageWidth / 2, currentY, { align: 'center' });
    }

    // Advance to next page for table of contents or first act
    doc.addPage();
    currentY = marginTop;
  }

  // ==========================================
  // 2. TABLE OF CONTENTS
  // ==========================================
  if (includeToc) {
    onProgress?.({
      percent: 25,
      stage: 'Generating table of contents...',
      detail: `Indexing ${totalChaptersCount} chapters across acts`,
    });
    await sleep(70);

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    doc.text('Table of Contents', marginX, currentY);
    currentY += 10;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY, marginX + contentWidth, currentY);
    currentY += 8;

    targetBooks.forEach((book) => {
      if (targetBooks.length > 1) {
        doc.setFont(primaryFont, 'bold');
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        ensureSpace(8);
        doc.text(book.title, marginX, currentY);
        currentY += 6;
      }

      book.acts?.forEach((act) => {
        ensureSpace(7);
        doc.setFont(primaryFont, 'bold');
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text(act.title, marginX + 3, currentY);
        currentY += 6;

        act.chapters?.forEach((ch, chIdx) => {
          ensureSpace(5);
          doc.setFont(primaryFont, 'normal');
          doc.setFontSize(10);
          doc.setTextColor(90, 90, 90);
          const chTitle = `${chIdx + 1}. ${ch.title}`;
          doc.text(chTitle, marginX + 8, currentY);
          currentY += 5;
        });
        currentY += 2;
      });
      currentY += 4;
    });

    // Page break after TOC
    doc.addPage();
    currentY = marginTop;
  }

  // ==========================================
  // 3. BOOK CONTENT (ACTS & CHAPTERS)
  // ==========================================
  let chaptersProcessed = 0;

  for (let bIdx = 0; bIdx < targetBooks.length; bIdx++) {
    const book = targetBooks[bIdx];

    // If multi-volume, show Book Title Banner
    if (targetBooks.length > 1 && bIdx > 0) {
      doc.addPage();
      currentY = 80;
      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(22);
      doc.setTextColor(20, 20, 20);
      doc.text(book.title, pageWidth / 2, currentY, { align: 'center' });
      currentY += 12;
      if (book.synopsis) {
        doc.setFont(primaryFont, 'italic');
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        const bSyn = doc.splitTextToSize(book.synopsis, contentWidth - 30);
        doc.text(bSyn, pageWidth / 2, currentY, { align: 'center' });
      }
      doc.addPage();
      currentY = marginTop;
    }

    for (let actIdx = 0; actIdx < (book.acts?.length || 0); actIdx++) {
      const act = book.acts[actIdx];

      // Act Title Page / Header
      ensureSpace(35);
      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.text(act.title.toUpperCase(), marginX, currentY);
      currentY += 7;

      if (act.synopsis) {
        doc.setFont(primaryFont, 'italic');
        doc.setFontSize(10);
        doc.setTextColor(110, 110, 110);
        const actSynLines = doc.splitTextToSize(act.synopsis, contentWidth);
        doc.text(actSynLines, marginX, currentY);
        currentY += actSynLines.length * 4.5 + 4;
      }

      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.line(marginX, currentY, marginX + contentWidth, currentY);
      currentY += 12;

      // Chapters inside this Act
      for (let chIdx = 0; chIdx < (act.chapters?.length || 0); chIdx++) {
        const chapter = act.chapters[chIdx];
        chaptersProcessed++;

        const currentPercent = Math.min(
          85,
          Math.round(30 + (chaptersProcessed / totalChaptersCount) * 55)
        );

        onProgress?.({
          percent: currentPercent,
          stage: `Typesetting Chapter ${chaptersProcessed} of ${totalChaptersCount}...`,
          detail: chapter.title,
        });
        await sleep(30);

        // Each Chapter starts on a fresh page for clean typesetting
        if (currentY > marginTop + 15) {
          doc.addPage();
          currentY = marginTop;
        }

        // Chapter Header
        doc.setFont(primaryFont, 'bold');
        doc.setFontSize(16);
        doc.setTextColor(15, 15, 15);
        doc.text(`Chapter ${chIdx + 1}: ${chapter.title}`, marginX, currentY);
        currentY += 6;

        if (chapter.synopsis) {
          doc.setFont(primaryFont, 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(120, 120, 120);
          const chSyn = doc.splitTextToSize(`"${chapter.synopsis}"`, contentWidth);
          doc.text(chSyn, marginX, currentY);
          currentY += chSyn.length * 4.5 + 4;
        }

        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(marginX, currentY, marginX + 35, currentY);
        currentY += 10;

        // Scenes within chapter
        const scenes = chapter.scenes || [];
        for (let scIdx = 0; scIdx < scenes.length; scIdx++) {
          const scene = scenes[scIdx];

          // If multiple scenes in chapter, show scene subheader or break
          if (scIdx > 0) {
            ensureSpace(16);
            currentY += 4;
            // Elegant scene divider glyph
            doc.setFont(primaryFont, 'bold');
            doc.setFontSize(12);
            doc.setTextColor(160, 160, 160);
            doc.text('* * *', pageWidth / 2, currentY, { align: 'center' });
            currentY += 8;

            if (scene.title && scene.title !== chapter.title) {
              doc.setFont(primaryFont, 'italic');
              doc.setFontSize(11);
              doc.setTextColor(80, 80, 80);
              doc.text(scene.title, marginX, currentY);
              currentY += 6;
            }
          }

          // Scene prose paragraphs
          const rawContent = scene.content || '';
          const cleanedContent = cleanMarkdown(rawContent);

          if (!cleanedContent) {
            doc.setFont(primaryFont, 'italic');
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            ensureSpace(8);
            doc.text('[Scene in progress...]', marginX, currentY);
            currentY += 8;
            continue;
          }

          const paragraphs = cleanedContent
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean);

          for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
            const pText = paragraphs[pIdx];
            doc.setFont(primaryFont, 'normal');
            doc.setFontSize(11);
            doc.setTextColor(30, 30, 30);

            // Split into printable lines matching page width
            const pLines = doc.splitTextToSize(pText, contentWidth);
            const pHeight = pLines.length * 5.2;

            ensureSpace(pHeight + 4);

            doc.text(pLines, marginX, currentY, {
              lineHeightFactor: 1.25,
            });

            currentY += pHeight + 3.5; // Paragraph spacing
          }
        }

        currentY += 6;
      }
    }
  }

  // ==========================================
  // 4. RUNNING HEADERS & FOOTERS (PAGE NUMBERS)
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  onProgress?.({
    percent: 88,
    stage: 'Adding running headers & page numbers...',
    detail: `Processing ${totalPages} typeset pages`,
  });
  await sleep(60);

  for (let i = 1; i <= totalPages; i++) {
    // Skip title page headers & footers
    if (includeTitlePage && i === 1) continue;

    doc.setPage(i);

    // Running Header (Book Title left, Author right)
    if (includeRunningHeaders && i > (includeToc ? 2 : 1)) {
      doc.setFont(primaryFont, 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);

      const headerTextLeft = project.title;
      doc.text(headerTextLeft, marginX, 14);

      const headerTextRight = project.author;
      doc.text(headerTextRight, pageWidth - marginX, 14, { align: 'right' });

      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.15);
      doc.line(marginX, 16.5, pageWidth - marginX, 16.5);
    }

    // Running Footer (Page Numbers)
    if (includePageNumbers) {
      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      const pageStr = `- ${i} -`;
      doc.text(pageStr, pageWidth / 2, pageHeight - 12, { align: 'center' });
    }
  }

  // ==========================================
  // 5. FINALIZE & DOWNLOAD
  // ==========================================
  const safeTitle = project.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
  const filename = `${safeTitle}_manuscript.pdf`;

  onProgress?.({
    percent: 96,
    stage: 'Compiling PDF binary and triggering download...',
    detail: filename,
  });
  await sleep(80);

  doc.save(filename);

  onProgress?.({
    percent: 100,
    stage: 'PDF Export Complete!',
    detail: `Saved ${filename} (~${totalPages} pages)`,
  });
  await sleep(200);
}
