const EMOJI = /\p{Emoji_Presentation}|️/u

/**
 * whether the grapheme is displayed as an emoji by default.
 * true for graphemes that contain a char with Emoji_Presentation (e.g. 😀, 👨‍👩‍👧, 🇯🇵)
 * or a variation selector-16 (e.g. ❤️, 1️⃣). false for text presentation chars (e.g. ❤, ©, 1).
 * @param grapheme a single grapheme
 */
export const isEmoji = (grapheme: string): boolean => EMOJI.test(grapheme)
