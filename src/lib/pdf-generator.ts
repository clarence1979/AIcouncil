import jsPDF from 'jspdf';
import type { Message, LocalAIParticipant } from '../types';

export async function generateTranscriptPDF(
  messages: Message[],
  participants: LocalAIParticipant[],
  _topic: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AI Council Discussion', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 15;

  const userMessage = messages.find(m => m.senderType === 'user');
  if (userMessage) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Topic:', margin, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    const topicLines = doc.splitTextToSize(userMessage.content, maxWidth);
    doc.text(topicLines, margin, yPosition);
    yPosition += topicLines.length * 5 + 10;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Participants:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  participants.forEach(p => {
    const name = p.customName || p.defaultName;
    doc.text(`${p.avatar} ${name} (${p.provider})`, margin + 5, yPosition);
    yPosition += 5;
  });
  yPosition += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Discussion', margin, yPosition);
  yPosition += 10;

  const aiMessages = messages.filter(m => m.senderType === 'ai');

  aiMessages.forEach((msg) => {
    const participant = participants.find(p => p.id === msg.participantId);
    const name = participant?.customName || participant?.defaultName || 'AI';
    const avatar = participant?.avatar || '🤖';

    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204);
    doc.text(`${avatar} ${name}`, margin, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const contentLines = doc.splitTextToSize(msg.content, maxWidth);
    contentLines.forEach((line: string) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 8;
  });

  doc.save(`ai-council-transcript-${Date.now()}.pdf`);
}

export async function generateSummaryPDF(
  summary: string,
  winner: string,
  messages: Message[],
  participants: LocalAIParticipant[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxWidth = pageWidth - 2 * margin;
  let y = margin;

  const checkPage = (needed = 20) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Header banner ────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(147, 210, 255);
  doc.text('AI Council', margin, 16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Discussion Summary Report', margin, 26);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(new Date().toLocaleString(), pageWidth - margin, 26, { align: 'right' });

  y = 44;

  // ── Topic ────────────────────────────────────────────────────────────
  const userMessage = messages.find(m => m.senderType === 'user');
  if (userMessage) {
    doc.setFillColor(240, 249, 255);
    const topicLines = doc.splitTextToSize(userMessage.content, maxWidth - 10);
    const topicBlockH = topicLines.length * 5.5 + 12;
    doc.roundedRect(margin, y, maxWidth, topicBlockH, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 116, 144);
    doc.text('DISCUSSION TOPIC', margin + 5, y + 7);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(topicLines, margin + 5, y + 13);
    y += topicBlockH + 10;
  }

  // ── WINNER banner ────────────────────────────────────────────────────
  checkPage(50);

  // Gold trophy accent bar
  doc.setFillColor(21, 128, 61);
  doc.rect(margin, y, maxWidth, 2, 'F');
  y += 6;

  doc.setFillColor(240, 253, 244);
  const winnerLines = doc.splitTextToSize(winner, maxWidth - 16);
  const winnerBlockH = winnerLines.length * 5.5 + 24;
  doc.roundedRect(margin, y, maxWidth, winnerBlockH, 4, 4, 'F');

  // Left accent strip (green)
  doc.setFillColor(21, 128, 61);
  doc.rect(margin, y, 4, winnerBlockH, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61);
  doc.text('WINNER', margin + 10, y + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 101, 52);
  doc.text('Most compelling arguments & best reasoning', margin + 10, y + 17);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(winnerLines, margin + 10, y + 25);

  y += winnerBlockH + 12;

  // ── Participants ─────────────────────────────────────────────────────
  checkPage(30);
  const aiMessages = messages.filter(m => m.senderType === 'ai');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text('Participants', margin, y);
  y += 2;
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 8;

  const cardGap = 6;
  const colW = (maxWidth - cardGap) / 2;
  const cardH = 18;

  for (let i = 0; i < participants.length; i += 2) {
    checkPage(cardH + 4);
    for (let j = 0; j < 2 && i + j < participants.length; j++) {
      const p = participants[i + j];
      const cx = margin + j * (colW + cardGap);
      const count = aiMessages.filter(m => m.participantId === p.id).length;
      const name = p.customName || p.defaultName;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cx, y, colW, cardH, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, y, colW, cardH, 2, 2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${p.avatar}  ${name}`, cx + 5, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${p.provider.toUpperCase()} · ${count} message${count !== 1 ? 's' : ''}`, cx + 5, y + 14);
    }
    y += cardH + 4;
  }

  y += 6;

  // ── Summary ──────────────────────────────────────────────────────────
  checkPage(25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text('Discussion Summary', margin, y);
  y += 2;
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(summary, maxWidth);
  summaryLines.forEach((line: string) => {
    checkPage(8);
    doc.text(line, margin, y);
    y += 5.5;
  });
  y += 10;

  // ── Statistics ───────────────────────────────────────────────────────
  checkPage(30);

  doc.setFillColor(248, 250, 252);
  const statsH = 26;
  doc.roundedRect(margin, y, maxWidth, statsH, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, maxWidth, statsH, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL MESSAGES', margin + 8, y + 9);
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(String(aiMessages.length), margin + 8, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('PARTICIPANTS', margin + colW + 8, y + 9);
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(String(participants.length), margin + colW + 8, y + 20);

  y += statsH + 12;

  // ── Footer ────────────────────────────────────────────────────────────
  const totalPages = (doc.internal as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('AI Council · Discussion Summary', margin, pageHeight - 3.5);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 3.5, { align: 'right' });
  }

  doc.save(`ai-council-summary-${Date.now()}.pdf`);
}
