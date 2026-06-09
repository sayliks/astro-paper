declare module "@pagefind/default-ui" {
  export type PagefindTranslations = Record<string, string>;

  export type PagefindUIOptions = {
    element: string;
    bundlePath: string;
    showImages?: boolean;
    showSubResults?: boolean;
    translations?: PagefindTranslations;
    processTerm?: (term: string) => string;
  };

  export class PagefindUI {
    constructor(options: PagefindUIOptions);
    triggerSearch(term: string): void;
  }
}
