import ts from 'typescript';
import { CodeGeneratorRequest, CodeGeneratorRequest_RequestedFile, Node, CodeGeneratorRequest_RequestedFile_Import, Field } from '../capnp/schema.mjs';
import '../shared/capnp-es.CnTZV_-5.mjs';
import '../shared/capnp-es.D8uferQ3.mjs';

declare class CodeGeneratorContext {
    files: CodeGeneratorFileContext[];
}
declare class CodeGeneratorFileContext {
    readonly req: CodeGeneratorRequest;
    readonly file: CodeGeneratorRequest_RequestedFile;
    readonly nodes: Node[];
    readonly imports: CodeGeneratorRequest_RequestedFile_Import[];
    concreteLists: Array<[string, Field]>;
    generatedNodeIds: Set<string>;
    generatedResultsPromiseIds: Set<bigint>;
    tsPath: string;
    codeParts: string[];
    constructor(req: CodeGeneratorRequest, file: CodeGeneratorRequest_RequestedFile);
    toString(): string;
}

/**
 * Compiles Cap'n Proto schema files into TypeScript/JavaScript code.
 *
 * @see `src/capnp/_capnp/schema.capnp`
 *
 * @param codeGenRequest - Buffer containing the Cap'n Proto CodeGeneratorRequest message
 * @param opts - Compilation options
 * @param opts.ts - Whether to generate TypeScript (.ts) files
 * @param opts.js - Whether to generate JavaScript (.js) files
 * @param opts.dts - Whether to generate TypeScript declaration (.d.ts) files
 * @param opts.tsconfig - Custom TypeScript compiler options
 * @returns Object containing the compilation context and generated files
 * @returns.ctx - The CodeGeneratorContext used during compilation
 * @returns.files - Map of file paths to their generated content
 */
declare function compileAll(codeGenRequest: Buffer, opts?: {
    ts?: boolean;
    js?: boolean;
    dts?: boolean;
    tsconfig?: ts.CompilerOptions;
}): Promise<{
    ctx: CodeGeneratorContext;
    files: Map<string, string>;
}>;

export { compileAll };
