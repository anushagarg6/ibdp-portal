export const MAX_ATTACHMENT_BYTES = 4_000_000;
export const MAX_CLASS_ATTACHMENTS = 3;

export type AttachmentType = {
  contentType: string;
  extension: "png" | "jpg" | "webp" | "pdf" | "docx";
  kind: "image" | "pdf" | "word";
};

function containsAscii(bytes: Uint8Array, value: string) {
  const marker = new TextEncoder().encode(value);
  return bytes.some((_, start) => marker.every((part, offset) => bytes[start + offset] === part));
}

export function detectAttachmentType(bytes: Uint8Array): AttachmentType | null {
  if (bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])) {
    return { contentType: "image/png", extension: "png", kind: "image" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg", kind: "image" };
  }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { contentType: "image/webp", extension: "webp", kind: "image" };
  }
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") {
    return { contentType: "application/pdf", extension: "pdf", kind: "pdf" };
  }
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04 && containsAscii(bytes, "word/document.xml")) {
    return {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: "docx",
      kind: "word"
    };
  }
  return null;
}

export function attachmentKindFromPath(path: string): AttachmentType["kind"] {
  if (path.endsWith(".pdf")) return "pdf";
  if (path.endsWith(".docx")) return "word";
  return "image";
}

export function attachmentResponseType(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "pdf") return "application/pdf";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "image/jpeg";
}

export function safePathPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "item";
}
