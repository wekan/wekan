import { S as Struct, C as Client, e as PipelineOp, f as Call, A as Answer, g as StructCtor, P as Pointer } from './capnp-es.CnTZV_-5.js';

/**
 * PipelineClient implements Client by calling to the pipeline's answer.
 */
declare class PipelineClient<AnswerResults extends Struct, ParentResults extends Struct, Results extends Struct> implements Client {
    pipeline: Pipeline<AnswerResults, ParentResults, Results>;
    constructor(pipeline: Pipeline<AnswerResults, ParentResults, Results>);
    transform(): PipelineOp[];
    call<CallParams extends Struct, CallResults extends Struct>(call: Call<CallParams, CallResults>): Answer<CallResults>;
    close(): void;
}

/**
 * A Pipeline is a generic wrapper for an answer
 */
declare class Pipeline<AnswerResults extends Struct, ParentResults extends Struct, Results extends Struct> {
    ResultsClass: StructCtor<Results>;
    answer: Answer<AnswerResults>;
    parent?: Pipeline<AnswerResults, Struct, ParentResults> | undefined;
    op: PipelineOp;
    pipelineClient?: PipelineClient<AnswerResults, ParentResults, Results>;
    constructor(ResultsClass: StructCtor<Results>, answer: Answer<AnswerResults>, op?: PipelineOp, parent?: Pipeline<AnswerResults, Struct, ParentResults> | undefined);
    transform(): PipelineOp[];
    struct(): Promise<Results>;
    client(): PipelineClient<AnswerResults, ParentResults, Results>;
    getPipeline<RR extends Struct>(ResultsClass: StructCtor<RR>, off: number, defaultValue?: Pointer): Pipeline<AnswerResults, Results, RR>;
}

export { Pipeline as P };
