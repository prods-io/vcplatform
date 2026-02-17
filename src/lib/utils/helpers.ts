/**
 * Format a number as a USD currency string.
 * Examples: 1000 -> "$1,000", 1500000 -> "$1.5M", 1000000000 -> "$1B"
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    const billions = amount / 1_000_000_000
    const formatted = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)
    return `$${formatted}B`
  }
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
    return `$${formatted}M`
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
    return `$${formatted}K`
  }
  return `$${amount.toLocaleString("en-US")}`
}

/**
 * Format a check size range into a human-readable string.
 * Examples:
 *   (100000, 500000) -> "$100K - $500K"
 *   (null, 1000000) -> "Up to $1M"
 *   (50000, null) -> "$50K+"
 *   (null, null) -> "Undisclosed"
 */
export function formatCheckSize(min?: number | null, max?: number | null): string {
  if (min != null && max != null) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`
  }
  if (min != null) {
    return `${formatCurrency(min)}+`
  }
  if (max != null) {
    return `Up to ${formatCurrency(max)}`
  }
  return "Undisclosed"
}

/**
 * Create a URL-friendly slug from a text string.
 * Examples: "Hello World!" -> "hello-world", "My VC Firm" -> "my-vc-firm"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Get initials from a name string (up to 2 characters).
 * Examples: "John Doe" -> "JD", "Alice" -> "A", "John Michael Doe" -> "JD"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Truncate a text string to a specified length, appending an ellipsis if truncated.
 * Examples: truncate("Hello World", 5) -> "Hello..."
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + "..."
}
