/**
 * @typedef {{heading: string|null, text: string}} ImportSection
 * @typedef {{type: string, url: string|null, alt: string|null}} ImportMedia
 * @typedef {{sourcePlatform:"substack"|"x",sourceUrl:string,title:string|null,subtitle:string|null,authorName:string|null,authorHandle:string|null,publishedAt:string|null,body:string|null,sections:ImportSection[],media:ImportMedia[],rawExtractedText:string|null,warnings:string[],isPartial:boolean}} ImportPayload
 */
export {};
