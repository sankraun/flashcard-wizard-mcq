import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Trash2, Calendar, Filter } from 'lucide-react';
import jsPDF from 'jspdf';

interface Note {
  id: string;
  title: string;
  content: string;
  original_text: string | null;
  created_at: string;
  updated_at: string;
}

const SavedNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  // Function to format notes for display with proper HTML and custom styles
  const formatNotesForDisplay = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>') // Highlight key points (bold)
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/^### (.*$)/gm, '<h3 style="font-family: Calibri, Arial, sans-serif; font-size: 1.1rem;" class="text-lg font-bold mt-4 mb-2 text-pink-600">$1</h3>') // H3 headings (subheading, pink)
      .replace(/^## (.*$)/gm, '<h2 style="font-family: Calibri, Arial, sans-serif; font-size: 1.25rem;" class="text-xl font-bold mt-6 mb-3 text-green-700">$1</h2>') // H2 headings (main subheading, green)
      .replace(/^# (.*$)/gm, '<h1 style="font-family: Calibri, Arial, sans-serif; font-size: 1.5rem;" class="text-2xl font-bold mt-8 mb-4 text-blue-900">$1</h1>') // H1 headings (main heading)
      .replace(/^- (.*$)/gm, '<li style="font-family: Calibri, Arial, sans-serif; font-size: 1rem;" class="ml-4">• <span class="bg-yellow-100 px-1 rounded">$1</span></li>') // Bullet points highlighted
      .replace(/\n\n/g, '</p><p class="mb-2" style="font-family: Calibri, Arial, sans-serif; font-size: 1rem;">') // Paragraphs
      .replace(/\n/g, '<br/>'); // Line breaks
  };

  // Function to clean markdown for plain text (PDF and Google Docs)
  const cleanMarkdownForExport = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers but keep text
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers but keep text
      .replace(/^#{1,3}\s+/gm, '')      // Remove heading markers
      .replace(/^-\s+/gm, '• ');        // Convert bullet points
  };

  const exportToPDF = (note: Note) => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const lineHeight = 12; // very small font and tight spacing
    let yPosition = margin;
    let pageNumber = 1;
    const addPageNumber = () => {
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
    };

    // Title (H1)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(10, 30, 80);
    pdf.text(note.title, margin, yPosition);
    yPosition += lineHeight * 2;

    // Creation date
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Created: ${new Date(note.created_at).toLocaleDateString()}`, margin, yPosition);
    yPosition += lineHeight * 1.5;

    // Divider
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight * 0.7;

    // Content
    const lines = note.content.split('\n');
    let inBulletList = false;
    let inTable = false;
    let tableRows = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Table row (markdown style: | col1 | col2 | ... |)
      if (/^\s*\|(.+)\|\s*$/.test(line)) {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        tableRows.push(cells);
        inTable = true;
        // If next line is not a table, render the table
        if (i + 1 >= lines.length || !/^\s*\|(.+)\|\s*$/.test(lines[i + 1])) {
          // Draw table
          const colCount = tableRows[0].length;
          const colWidth = (pageWidth - margin * 2) / colCount;
          let tableY = yPosition;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          // Header row
          tableRows.forEach((row, rowIdx) => {
            let x = margin;
            row.forEach((cell, colIdx) => {
              pdf.rect(x, tableY - 8, colWidth, lineHeight + 4);
              pdf.text(String(cell), x + 2, tableY);
              x += colWidth;
            });
            tableY += lineHeight * 1.2;
            if (tableY > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; tableY = margin; }
          });
          yPosition = tableY + lineHeight * 0.5;
          tableRows = [];
          inTable = false;
        }
        continue;
      } else if (inTable) {
        // End of table
        tableRows = [];
        inTable = false;
        yPosition += lineHeight * 0.5;
      }
      // H1
      if (/^# (.*)/.test(line)) {
        if (inBulletList) { inBulletList = false; yPosition += lineHeight * 0.5; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(10, 30, 80);
        const h1Text = line.replace(/^# /, '');
        const splitLines = pdf.splitTextToSize(h1Text, pageWidth - margin * 2);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin, yPosition);
          yPosition += lineHeight * 2;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.5;
        continue;
      }
      // H2
      if (/^## (.*)/.test(line)) {
        if (inBulletList) { inBulletList = false; yPosition += lineHeight * 0.5; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(34, 139, 34);
        const h2Text = line.replace(/^## /, '');
        const splitLines = pdf.splitTextToSize(h2Text, pageWidth - margin * 2 - 10);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin + 10, yPosition);
          yPosition += lineHeight * 1.5;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.5;
        continue;
      }
      // H3
      if (/^### (.*)/.test(line)) {
        if (inBulletList) { inBulletList = false; yPosition += lineHeight * 0.5; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(219, 39, 119);
        const h3Text = line.replace(/^### /, '');
        const splitLines = pdf.splitTextToSize(h3Text, pageWidth - margin * 2 - 20);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin + 20, yPosition);
          yPosition += lineHeight * 1.2;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.3;
        continue;
      }
      // Bullet points (convert * and - to bullets)
      if (/^(- |\* )(.+)/.test(line)) {
        if (!inBulletList) { inBulletList = true; yPosition += lineHeight * 0.3; }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFillColor(255, 249, 196);
        pdf.rect(margin + 20, yPosition - 9, pageWidth - margin * 2 - 20, lineHeight + 2, 'F');
        let bulletText = line.replace(/^(- |\* )/, '\u2022 ');
        bulletText = bulletText.replace(/\*\*(.*?)\*\*/g, '$1');
        bulletText = bulletText.replace(/\*(.*?)\*/g, '$1');
        const splitLines = pdf.splitTextToSize(bulletText, pageWidth - margin * 2 - 25);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin + 25, yPosition);
          yPosition += lineHeight * 1.15;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        continue;
      } else if (inBulletList) {
        inBulletList = false;
        yPosition += lineHeight * 0.5;
      }
      // Key points (bold)
      if (/\*\*(.*?)\*\*/.test(line)) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFillColor(255, 249, 196);
        pdf.rect(margin, yPosition - 9, pageWidth - margin * 2, lineHeight + 2, 'F');
        const boldText = line.replace(/\*\*(.*?)\*\*/g, '$1');
        const splitLines = pdf.splitTextToSize(boldText, pageWidth - margin * 2);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin, yPosition);
          yPosition += lineHeight * 1.15;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.2;
        continue;
      }
      // Italic (render as normal text, no asterisks)
      if (/\*(.*?)\*/.test(line)) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const italicText = line.replace(/\*(.*?)\*/g, '$1');
        const splitLines = pdf.splitTextToSize(italicText, pageWidth - margin * 2);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin, yPosition);
          yPosition += lineHeight * 1.1;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.1;
        continue;
      }
      // Normal text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const splitLines = pdf.splitTextToSize(line, pageWidth - margin * 2);
      for (const splitLine of splitLines) {
        pdf.text(splitLine, margin, yPosition);
        yPosition += lineHeight * 1.2;
        if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
      }
      yPosition += lineHeight * 0.2;
    }
    addPageNumber();
    pdf.save(`${note.title.replace(/[^\w\s]/gi, '')}.pdf`);
    toast({
      title: "Success!",
      description: "Note exported as PDF",
    });
  };

  const exportToDoc = (note: Note) => {
    // Use the same structure and formatting as PDF export
    let htmlContent = `<html><head><meta charset='utf-8'><title>${note.title}</title></head><body style="font-family:Calibri,Arial,sans-serif;">
      <h1 style="color:#0a1e50;font-size:1.5rem;margin-bottom:0.5em;">${note.title}</h1>
      <div style="color:#888;font-size:0.8rem;margin-bottom:0.5em;">Created: ${new Date(note.created_at).toLocaleDateString()}</div>
      <hr style="border:1px solid #ccc; margin:12px 0;"/>
    `;
    const lines = note.content.split('\n');
    let inList = false;
    let inTable = false;
    let tableRows = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Table row (markdown style: | col1 | col2 | ... |)
      if (/^\s*\|(.+)\|\s*$/.test(line)) {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        tableRows.push(cells);
        inTable = true;
        if ((i + 1 >= lines.length) || !/^\s*\|(.+)\|\s*$/.test(lines[i + 1])) {
          // Render table
          htmlContent += '<table style="border-collapse:collapse;width:100%;margin-bottom:1em;">';
          tableRows.forEach((row, rowIdx) => {
            htmlContent += '<tr>';
            row.forEach(cell => {
              htmlContent += `<td style="border:1px solid #bbb;padding:6px 8px;font-size:1rem;${rowIdx===0?'font-weight:bold;background:#f5f5f5;':''}">${cell}</td>`;
            });
            htmlContent += '</tr>';
          });
          htmlContent += '</table>';
          tableRows = [];
          inTable = false;
        }
        continue;
      } else if (inTable) {
        tableRows = [];
        inTable = false;
      }
      // H1
      if (/^# (.*)/.test(line)) {
        if (inList) { htmlContent += '</ul>'; inList = false; }
        htmlContent += `<h2 style="color:#0a1e50;font-size:1.2rem;margin-top:1.5em;margin-bottom:0.5em;">${line.replace(/^# /, '')}</h2>`;
        continue;
      }
      // H2
      if (/^## (.*)/.test(line)) {
        if (inList) { htmlContent += '</ul>'; inList = false; }
        htmlContent += `<h3 style="color:#228b22;font-size:1.1rem;margin-top:1.2em;margin-bottom:0.4em;">${line.replace(/^## /, '')}</h3>`;
        continue;
      }
      // H3
      if (/^### (.*)/.test(line)) {
        if (inList) { htmlContent += '</ul>'; inList = false; }
        htmlContent += `<h4 style="color:#db2777;font-size:1rem;margin-top:1em;margin-bottom:0.3em;">${line.replace(/^### /, '')}</h4>`;
        continue;
      }
      // Bullet points (convert * and - to bullets)
      if (/^(- |\* )(.+)/.test(line)) {
        if (!inList) { htmlContent += '<ul style="margin-bottom:0.5em;">'; inList = true; }
        let bulletText = line.replace(/^(- |\* )/, '');
        bulletText = bulletText.replace(/\*\*(.*?)\*\*/g, '<span style="font-weight:bold;background:#fff9c4;">$1</span>');
        bulletText = bulletText.replace(/\*(.*?)\*/g, '<span style="font-style:italic;">$1</span>');
        htmlContent += `<li style="margin-bottom:0.2em;font-size:1rem;">${bulletText}</li>`;
        continue;
      } else if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      // Key points (bold)
      if (/\*\*(.*?)\*\*/.test(line)) {
        htmlContent += `<div style="font-weight:bold;background:#fff9c4;padding:2px 6px;border-radius:4px;display:inline-block;margin-bottom:0.2em;">${line.replace(/\*\*(.*?)\*\*/g, '$1')}</div><br/>`;
        continue;
      }
      // Italic (render as normal text, no asterisks)
      if (/\*(.*?)\*/.test(line)) {
        htmlContent += `<span style="font-style:italic;">${line.replace(/\*(.*?)\*/g, '$1')}</span><br/>`;
        continue;
      }
      // Normal text
      htmlContent += `<div style="font-size:1rem;margin-bottom:0.3em;">${line}</div>`;
    }
    if (inList) htmlContent += '</ul>';
    htmlContent += '</body></html>';
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^\w\s]/gi, '')}.doc`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    toast({
      title: "Success!",
      description: "Note exported as .doc file",
    });
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (dateFilter === "All") return true;
    const noteDate = new Date(note.created_at);
    if (dateFilter === "Today") return isToday(noteDate);
    if (dateFilter === "This Week") return isThisWeek(noteDate);
    if (dateFilter === "This Month") return isThisMonth(noteDate);
    return true;
  });

  function isToday(date: Date) {
    const now = new Date();
    return date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
  }
  function isThisWeek(date: Date) {
    const now = new Date();
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay());
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  }
  function isThisMonth(date: Date) {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  const openNoteInNewTab = (note: Note) => {
    const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>${note.title}</title><style>
      body { font-family: Calibri, Arial, sans-serif; background: #f9fafb; color: #222; margin: 0; padding: 2rem; }
      .note-title { color: #0a1e50; font-size: 2rem; font-weight: bold; margin-bottom: 0.5em; }
      .note-date { color: #888; font-size: 0.9rem; margin-bottom: 1em; }
      .note-content { max-width: 700px; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px #0001; padding: 2rem; }
      h1, h2, h3 { margin-top: 1.5em; }
      h1 { color: #0a1e50; font-size: 1.5rem; }
      h2 { color: #228b22; font-size: 1.2rem; }
      h3 { color: #db2777; font-size: 1.1rem; }
      mark { background: #fff9c4; border-radius: 4px; padding: 0 4px; }
      ul { margin-left: 1.5em; }
      li { margin-bottom: 0.3em; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
      td { border: 1px solid #bbb; padding: 6px 8px; font-size: 1rem; }
      tr:first-child td { font-weight: bold; background: #f5f5f5; }
      @media (max-width: 600px) { .note-content { padding: 1rem; } body { padding: 0.5rem; } }
    </style></head><body><div class='note-content'>
      <div class='note-title'>${note.title}</div>
      <div class='note-date'>Created: ${new Date(note.created_at).toLocaleDateString()}</div>
      <hr style="border:1px solid #eee; margin:12px 0;"/>
      <div>${formatNotesForDisplay(note.content)}</div>
    </div></body></html>`;
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(html);
      newTab.document.close();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Saved Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
          <p className="text-muted-foreground">
            Generate your first structured notes to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b pb-4 mb-2 bg-white/80 sticky top-0 z-10">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <FileText className="w-5 h-5 text-blue-600" />
          Saved Notes <span className="text-gray-400 font-normal">({filteredNotes.length})</span>
        </CardTitle>
        <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <div className="relative w-full max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Search notes by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-full border bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="border rounded px-2 py-1 text-sm w-full max-w-xs bg-gray-50 text-gray-900 border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-0">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mb-2" />
            <div className="text-base font-medium">No notes found</div>
            <div className="text-sm">Try a different search or date filter.</div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredNotes.map((note) => (
              <li key={note.id} className="group flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-medium text-gray-900 truncate max-w-xs group-hover:underline">{note.title}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  <Button 
                    onClick={() => openNoteInNewTab(note)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-blue-50"
                    title="Open note in new tab"
                  >
                    {/* Eye icon for view */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1.5 12s3.5-7 10.5-7 10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
                  </Button>
                  <Button 
                    onClick={() => exportToPDF(note)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-50"
                    title="Export as PDF"
                  >
                    {/* Red down arrow for PDF */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4" /><rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor" /></svg>
                  </Button>
                  <Button 
                    onClick={() => exportToDoc(note)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-blue-50"
                    title="Export as DOC"
                  >
                    {/* Blue down arrow for DOC */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4" /><rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor" /></svg>
                  </Button>
                  <Button 
                    onClick={() => deleteNote(note.id)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-50"
                    title="Delete note"
                  >
                    {/* Delete: Trash (Lucide) icon */}
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedNotes;
