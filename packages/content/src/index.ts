// Public entry point of the content package: the data types, validation and the compiler
// that turns production-pack/09_Data into game content.

export * from './types.ts';
export { validateContent, ContentError, EXPECTED } from './validate.ts';
export { compileContent, canonicalJson, PRODUCT_NAME, SOURCE_FILES } from './compile.ts';
export type { RawContent } from './compile.ts';
