/** Display existing prototype records with the current English process names. */
export function englishOffsetLabel(value: string) {
  return value
    .replaceAll("Prepress / Pra-Cetak", "Prepress")
    .replaceAll("Press / Cetak", "Press / Printing")
    .replaceAll("Design Offset", "Offset Design");
}
