import { describe, expect, it } from "vitest";
import { attachmentKindFromPath, attachmentResponseType, detectAttachmentType, safePathPart } from "@/lib/image-upload";

describe("attachment upload validation", () => {
  it("recognizes supported image and document signatures", () => {
    expect(detectAttachmentType(new Uint8Array([0xff, 0xd8, 0xff]))?.extension).toBe("jpg");
    expect(detectAttachmentType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.extension).toBe("png");
    expect(detectAttachmentType(new TextEncoder().encode("RIFF0000WEBP"))?.extension).toBe("webp");
    expect(detectAttachmentType(new TextEncoder().encode("%PDF-1.7"))?.extension).toBe("pdf");
    expect(detectAttachmentType(new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...new TextEncoder().encode("word/document.xml")]))?.extension).toBe("docx");
  });

  it("rejects unsupported files and ordinary zip archives", () => {
    expect(detectAttachmentType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(detectAttachmentType(new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...new TextEncoder().encode("files/readme.txt")]))).toBeNull();
  });

  it("maps stored extensions to safe display and response types", () => {
    expect(attachmentKindFromPath("folder/file.pdf")).toBe("pdf");
    expect(attachmentKindFromPath("folder/file.docx")).toBe("word");
    expect(attachmentResponseType("folder/file.docx")).toContain("wordprocessingml");
  });

  it("creates safe storage path segments", () => {
    expect(safePathPart("Math AA / Section A")).toBe("math-aa-section-a");
  });
});
