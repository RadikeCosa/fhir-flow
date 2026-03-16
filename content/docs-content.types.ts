export interface DocSectionItem {
    label: string;
    description: string;
}

export interface DocSection {
    title: string;
    items: DocSectionItem[];
}

export interface DocsPageContent {
    title: string;
    intro: string;
    sections: DocSection[];
    backLinkLabel: string;
    backLinkHref: string;
}
