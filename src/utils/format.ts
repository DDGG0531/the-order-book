export function formatPrice(price: number) {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

export function formatSize(size: number): string {
  return size.toLocaleString('en-US')
}

export function formatTotal(total: number): string {
  return total.toLocaleString('en-US')
}
