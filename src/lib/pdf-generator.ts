import jsPDF from 'jspdf';
import type { Message, LocalAIParticipant } from '../types';

export async function generateTranscriptPDF(
  messages: Message[],
  participants: LocalAIParticipant[],
  topic: string
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

  aiMessages.forEach((msg, index) => {
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
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AI Council Summary', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 15;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 12;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 153, 51);
  doc.text('Winner', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const winnerLines = doc.splitTextToSize(winner, maxWidth);
  winnerLines.forEach((line: string) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 6;
  });
  yPosition += 12;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 12;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 204);
  doc.text('Discussion Summary', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const summaryLines = doc.splitTextToSize(summary, maxWidth);
  summaryLines.forEach((line: string) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 6;
  });
  yPosition += 15;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 12;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Discussion Statistics', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const aiMessages = messages.filter(m => m.senderType === 'ai');
  doc.text(`Total Messages: ${aiMessages.length}`, margin + 5, yPosition);
  yPosition += 6;
  doc.text(`Participants: ${participants.length}`, margin + 5, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Message Count by Participant:', margin + 5, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  participants.forEach(p => {
    const count = aiMessages.filter(m => m.participantId === p.id).length;
    const name = p.customName || p.defaultName;
    doc.text(`${p.avatar} ${name}: ${count} messages`, margin + 10, yPosition);
    yPosition += 5;
  });

  doc.save(`ai-council-summary-${Date.now()}.pdf`);
}
