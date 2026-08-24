export function formatPrice(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSqft(value: number | null | undefined) {
  if (value == null) return "";
  return new Intl.NumberFormat("en-US").format(value);
}

export function agentInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    uploading: "Uploading",
    processing: "Processing",
    review: "Review",
    approved: "Approved",
    rendering: "Rendering",
    done: "Done",
    failed: "Failed",
    exported: "Exported",
  };
  return map[status] ?? status;
}
