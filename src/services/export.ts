import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import jsPDF from "jspdf";
import type { ChangeSummary } from "../types/change";

function filename(summary: ChangeSummary, extension: string): string {
  return `${summary.change.number}-CAB-Summary.${extension}`;
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function date(value: string): string {
  return value ? new Date(value).toLocaleString() : "TBD";
}

export function exportSummaryPdf(summary: ChangeSummary): void {
  const { change, progress, approvals } = summary;
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const width = 516;
  let y = 52;

  const line = (label: string, value: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}:`, margin, y);
    pdf.setFont("helvetica", "normal");
    const wrapped = pdf.splitTextToSize(value || "—", width - 120);
    pdf.text(wrapped, margin + 112, y);
    y += Math.max(18, wrapped.length * 13 + 4);
  };

  const section = (title: string, body: string) => {
    if (y > 690) { pdf.addPage(); y = 52; }
    y += 8;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(title, margin, y);
    y += 16;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    const wrapped = pdf.splitTextToSize(body || "—", width);
    pdf.text(wrapped, margin, y);
    y += wrapped.length * 12 + 8;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("ChangeOps CAB Summary", margin, y);
  y += 26;
  pdf.setFontSize(12);
  pdf.text(`${change.number} — ${change.title}`, margin, y);
  y += 26;
  pdf.setFontSize(9.5);

  line("Requested by", change.requestedBy);
  line("Owner", change.owner);
  line("Type / Risk", `${change.type} / ${change.risk}`);
  line("Service", change.affectedService);
  line("Window", `${date(change.scheduledStart)} → ${date(change.scheduledEnd)}`);
  line("Status", `${change.status} / ${change.approvalState}`);
  line("Approvals", `${progress.approvedCount} approved of ${progress.requiredApprovals} required (${progress.eligibleApprovers} eligible)`);

  section("Description", change.description);
  section("Impact", change.impact);
  section("Implementation Plan", change.implementationPlan);
  section("Validation Plan", change.validationPlan);
  section("Backout Plan", change.backoutPlan);
  section(
    "Approval History",
    approvals.length
      ? approvals.map((a) => `${a.approverName}: ${a.decision} — ${date(a.createdAt)}${a.comment ? ` — ${a.comment}` : ""}`).join("\n")
      : "No approval decisions recorded.",
  );

  pdf.save(filename(summary, "pdf"));
}

export async function exportSummaryDocx(summary: ChangeSummary): Promise<void> {
  const { change, progress, approvals, audit } = summary;
  const rows = [
    ["Change", `${change.number} — ${change.title}`],
    ["Requested by", change.requestedBy],
    ["Owner", change.owner],
    ["Type / Risk", `${change.type} / ${change.risk}`],
    ["Affected service", change.affectedService],
    ["Scheduled window", `${date(change.scheduledStart)} → ${date(change.scheduledEnd)}`],
    ["Status", `${change.status} / ${change.approvalState}`],
    ["Approval quorum", `${progress.approvedCount} approved of ${progress.requiredApprovals} required; ${progress.eligibleApprovers} eligible approvers`],
  ];

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: "ChangeOps CAB Summary", heading: HeadingLevel.TITLE }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows.map(([label, value]) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(value)] }),
            ],
          })),
        }),
        ...[
          ["Description", change.description],
          ["Impact", change.impact],
          ["Implementation Plan", change.implementationPlan],
          ["Validation Plan", change.validationPlan],
          ["Backout Plan", change.backoutPlan],
        ].flatMap(([heading, body]) => [
          new Paragraph({ text: heading, heading: HeadingLevel.HEADING_2 }),
          new Paragraph(body || "—"),
        ]),
        new Paragraph({ text: "Approval History", heading: HeadingLevel.HEADING_2 }),
        ...(approvals.length ? approvals.map((approval) => new Paragraph({
          text: `${approval.approverName} — ${approval.decision} — ${date(approval.createdAt)}${approval.comment ? ` — ${approval.comment}` : ""}`,
          bullet: { level: 0 },
        })) : [new Paragraph("No approval decisions recorded.")]),
        new Paragraph({ text: "Audit History", heading: HeadingLevel.HEADING_2 }),
        ...audit.map((event) => new Paragraph({
          text: `${date(event.createdAt)} — ${event.action} — ${event.actor}: ${event.detail}`,
          bullet: { level: 0 },
        })),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  download(blob, filename(summary, "docx"));
}
