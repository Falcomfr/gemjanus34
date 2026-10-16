// French typography: a narrow no-break space keeps « ? ! : ; » on the line of the previous word.
export function fr(text: string): string {
  return text.replace(/ ([?!:;»])/g, "\u202f$1").replace(/« /g, "«\u202f");
}
