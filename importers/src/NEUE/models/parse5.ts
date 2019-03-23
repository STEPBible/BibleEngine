import { AST, MarkupData } from 'parse5';

/**
 * Element attribute.
 */
export interface Attribute {
    /**
     * The name of the attribute.
     */
    name: string;
    /**
     * The value of the attribute.
     */
    value: string;
    /**
     * The namespace of the attribute.
     */
    namespace?: string;
    /**
     * The namespace-related prefix of the attribute.
     */
    prefix?: string;
}

/**
 * Default tree adapter Node interface.
 */
export interface DefaultTreeNode {
    /**
     * The name of the node. E.g. {@link Document} will have `nodeName` equal to '#document'`.
     */
    nodeName: string;
}

/**
 * Default tree adapter ParentNode interface.
 */
export interface DefaultTreeParentNode {
    /**
     * Child nodes.
     */
    childNodes: DefaultNode[];
}

/**
 * Default tree adapter DocumentType interface.
 */
export interface DefaultTreeDocumentType extends DefaultTreeNode {
    /**
     * The name of the node.
     */
    nodeName: '#documentType';
    /**
     * Document type name.
     */
    name: string;
    /**
     * Document type public identifier.
     */
    publicId: string;
    /**
     * Document type system identifier.
     */
    systemId: string;
}

/**
 * Default tree adapter Document interface.
 */
export interface DefaultTreeDocument extends DefaultTreeParentNode {
    /**
     * The name of the node.
     */
    nodeName: '#document';
    /**
     * [Document mode](https://dom.spec.whatwg.org/#concept-document-limited-quirks).
     */
    mode: AST.DocumentMode;
}

/**
 * Default tree adapter DocumentFragment interface.
 */
export interface DefaultTreeDocumentFragment extends DefaultTreeParentNode {
    /**
     * The name of the node.
     */
    nodeName: '#document-fragment';
}

/**
 * Default tree adapter Element interface.
 */
export interface DefaultTreeElement extends DefaultTreeParentNode {
    /**
     * The name of the node. Equals to element {@link tagName}.
     */
    nodeName: string;
    /**
     * Element tag name.
     */
    tagName: string;
    /**
     * Element namespace.
     */
    namespaceURI: string;
    /**
     * List of element attributes.
     */
    attrs: Attribute[];
    /**
     * Parent node.
     */
    parentNode: DefaultTreeParentNode;
    /**
     * Element source code location info. Available if location info is enabled via {@link ParserOptions}.
     */
    sourceCodeLocation?: MarkupData.ElementLocation;
}

/**
 * Default tree adapter CommentNode interface.
 */
export interface DefaultTreeCommentNode extends DefaultTreeNode {
    /**
     * The name of the node.
     */
    nodeName: '#comment';
    /**
     * Comment text.
     */
    data: string;
    /**
     * Parent node.
     */
    parentNode: DefaultTreeParentNode;
    /**
     * Comment source code location info. Available if location info is enabled via {@link ParserOptions}.
     */
    sourceCodeLocation?: Location;
}

/**
 * Default tree adapter TextNode interface.
 */
export interface DefaultTreeTextNode extends DefaultTreeNode {
    /**
     * The name of the node.
     */
    readonly nodeName: '#text';
    /**
     * Text content.
     */
    value: string;
    /**
     * Parent node.
     */
    parentNode: DefaultTreeParentNode;
    /**
     * Text node source code location info. Available if location info is enabled via {@link ParserOptions}.
     */
    sourceCodeLocation?: Location;
}

export interface TreeDocumentType extends DefaultTreeDocumentType {
    readonly nodeName: '#documentType';
    // other fields
}
export interface TreeDocument extends DefaultTreeDocument {
    readonly nodeName: '#document';
    // other fields
}
export interface TreeDocumentFragment extends DefaultTreeDocumentFragment {
    readonly nodeName: '#document-fragment';
    // other fields
}
export interface TreeCommendNode extends DefaultTreeCommentNode {
    readonly nodeName: '#comment';
    // other fields
}
export interface TreeTextNode extends DefaultTreeTextNode {
    readonly nodeName: '#text';
    // other fields
}
export interface TreeElement extends DefaultTreeElement {
    readonly nodeName:
        | 'html'
        | 'body'
        | 'h1'
        | 'h2'
        | 'h3'
        | 'h4'
        | 'p'
        | 'div'
        | 'a'
        | 'span'
        | 'em'
        | 'b'
        | 'i'
        | 'strong'
        | 'img'
        | 'br'
        | 'ul';
}
export type DefaultNode =
    // | TreeDocumentType
    // | TreeDocument
    // | TreeDocumentFragment
    // | TreeCommendNode
    TreeTextNode | TreeElement;
