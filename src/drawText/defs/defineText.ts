import { ExtensionsMap, InitialStyleWithExtensionOptions, StyleInstructionWithExtension } from "./extension"
import { BaseOptions } from "./style"

/** typed styled text definition with extensions */
export const defineText = <M extends ExtensionsMap>(param: {
  text: string
  setting: BaseOptions
  extensions: M
  initialStyle: InitialStyleWithExtensionOptions<M>
  styles: StyleInstructionWithExtension<M>[]
}) => param

/** styled text with extensions */
export type StyledText<M extends ExtensionsMap> = ReturnType<typeof defineText<M>>
