/**
 * Exhaustiveness check helper using TypeScript's 'never' type.
 * Throws a runtime error if unhandled cases slip through.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled union value: ${JSON.stringify(value)}`);
}

/**
 * ANSI Color and Style codes for terminal formatting.
 */
export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",

  // Text colors
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // Bright text colors
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
};

/**
 * Formats a number as Indian Rupee (₹).
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Wraps text inside an elegant ASCII box.
 */
export function drawBox(title: string, lines: string[], borderColor = colors.cyan): string {
  const allText = [title, ...lines];
  // Strip ANSI escape codes to measure true character width
  const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");
  const maxLen = Math.max(40, ...allText.map((l) => stripAnsi(l).length + 4));

  const horizontal = "═".repeat(maxLen);
  const top = `${borderColor}╔${horizontal}╗${colors.reset}`;
  const bottom = `${borderColor}╚${horizontal}╝${colors.reset}`;

  const titleLen = stripAnsi(title).length;
  const leftPad = Math.max(0, Math.floor((maxLen - titleLen) / 2));
  const rightPad = Math.max(0, maxLen - titleLen - leftPad);
  const titleLine = `${borderColor}║${colors.reset}${" ".repeat(leftPad)}${colors.bold}${title}${colors.reset}${" ".repeat(rightPad)}${borderColor}║${colors.reset}`;

  const separator = `${borderColor}╠${"─".repeat(maxLen)}╣${colors.reset}`;

  const contentLines = lines.map((line) => {
    const len = stripAnsi(line).length;
    const pad = Math.max(0, maxLen - len - 2);
    return `${borderColor}║${colors.reset} ${line}${" ".repeat(pad)} ${borderColor}║${colors.reset}`;
  });

  return [top, titleLine, separator, ...contentLines, bottom].join("\n");
}
