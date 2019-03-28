export interface Context {
  [key: string]: any;
}

export interface SectionTags {
  o: string;
  c: string;
}

export interface Options {
  asString?: boolean;
  sectionTags?: SectionTags[];
  delimiters?: string;
  disableLambda?: boolean;
}

export interface Token {
  tag: string;
  otag?: string;
  ctag?: string;
  i?: number;
  n?: string;
  text?: string;
}

export interface Leaf extends Token {
  end: number;
  nodes: Token[];
}

export type Tree = Leaf[];

export class Partial {
  render(context: Context, partials?: Partials, indent?: string): string;
}

export interface Partials {
  [symbol: string]: Partial;
}


declare namespace Hogan {
  export { Partial as Template, Partial as template };

  export function compile(text: string, options?: Options): Template;
  export function scan(text: string, delimiters?: string): Token[];
  export function parse(tokens: Token[], text: undefined, options?: Options): Tree;
}

export default Hogan;
