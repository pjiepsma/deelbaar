export const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_COMPACT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const PERCENT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export const formatUsd = (value: number): string => {
  return USD_FORMATTER.format(value);
};

export const formatUsdCompact = (value: number): string => {
  return USD_COMPACT_FORMATTER.format(value);
};

// Input is a fraction, not a percentage: `-0.0241` -> "-2.41%".
export const formatPercent = (fraction: number): string => {
  return PERCENT_FORMATTER.format(fraction);
};

export const formatCompactNumber = (value: number): string => {
  return COMPACT_NUMBER_FORMATTER.format(value);
};

// Plain, ungrouped string suitable for direct rendering. Trims trailing
// zeros so small balances stay readable.
export const formatTokenAmount = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) {
    return "0";
  }
  const fixed = Math.abs(value).toFixed(6);
  const trimmed = fixed.replace(/\.?0+$/, "");
  const body = trimmed.length === 0 ? "0" : trimmed;
  return value < 0 ? ["-", body].join("") : body;
};

export const truncateAddress = (
  address: string,
  leading: number = 6,
  trailing: number = 4,
): string => {
  if (address.length <= leading + trailing + 1) {
    return address;
  }
  const head = address.slice(0, leading);
  const tail = address.slice(address.length - trailing);
  return [head, tail].join("...");
};
