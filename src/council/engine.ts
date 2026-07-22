import {
  PolarisEngine,
  PolarisEngineConfig,
  PolarisEngineTask,
  OpenAIStrategyAgent,
  StrategyAgent,
  DivergentPromptStrategy,
  InquisitorPromptStrategy,
  SynthesizerPromptStrategy,
  OrchestratorPromptStrategy,
  DivergentOutputParser,
  InquisitorOutputParser,
  SynthesizerOutputParser,
  OrchestratorOutputParser,
  LayerPipelineConfig,
  TaskBuilder,
  PhilosophyUtils,
} from "polaris-framework";

export interface CouncilOptions {
  question: string;
  maxIterations?: number;
  tokenBudget?: number;
}

export interface CouncilResult {
  question: string;
  finalOutput: string;
  totalIterations: number;
  forcedDelivery: boolean;
  forcedDeliveryReason?: string;
  totalTokensConsumed: number;
  lastVerdict: unknown;
  iterationBreakdowns: unknown[];
  agentOutputs: unknown[];
}

export async function runCouncil(options: CouncilOptions): Promise<CouncilResult> {
  const { question, maxIterations = 3, tokenBudget = 100_000 } = options;

  const task = TaskBuilder.create("council-debate", "Polaris Council Policy Debate")
    .description("Facilitate a multi-agent policy debate and synthesize a structured recommendation.")
    .commonDomain("DEBATE")
    .commonRoles(["ANALYST", "RISKY", "CONSERVATIVE", "EXPLORER", "QUESTIONING"])
    .goals(
      `Analyze the following policy question from multiple stakeholder perspectives and produce a balanced, structured recommendation: ${question}`,
      ["Surface stakeholder values", "Identify trade-offs", "Flag unresolved tensions"],
      ["Recommendation is nuanced", "Conflicting views are represented", "Actionable next steps are listed"]
    )
    .build();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const makeDivergentAgent = (name: string, roleKey: keyof typeof task.roles, temperature: number) =>
    new OpenAIStrategyAgent({
      name,
      role: task.roles[roleKey],
      task,
      promptStrategy: new DivergentPromptStrategy(),
      outputParserStrategy: new DivergentOutputParser(),
      model: "gpt-4o-mini",
      apiKey,
      temperature,
      maxTokens: 2000,
    });

  const divergentAgents: StrategyAgent[] = [
    makeDivergentAgent("Libertarian", "RISKY", 0.9),
    makeDivergentAgent("Privacy Advocate", "QUESTIONING", 0.85),
    makeDivergentAgent("Utilitarian", "ANALYST", 0.8),
    makeDivergentAgent("Technologist", "EXPLORER", 0.9),
    makeDivergentAgent("Regulator", "CONSERVATIVE", 0.8),
  ];

  const inquisitorAgent = new OpenAIStrategyAgent({
    name: "Inquisitor",
    role: task.roles["QUESTIONING"],
    task,
    promptStrategy: new InquisitorPromptStrategy(),
    outputParserStrategy: new InquisitorOutputParser(),
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.2,
    maxTokens: 2000,
  });

  const synthesizerAgent = new OpenAIStrategyAgent({
    name: "Synthesizer",
    role: task.roles["ANALYST"],
    task,
    promptStrategy: new SynthesizerPromptStrategy(),
    outputParserStrategy: new SynthesizerOutputParser(),
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.4,
    maxTokens: 2000,
  });

  const orchestratorAgent = new OpenAIStrategyAgent({
    name: "Orchestrator",
    role: task.roles["ANALYST"],
    task,
    promptStrategy: new OrchestratorPromptStrategy(),
    outputParserStrategy: new OrchestratorOutputParser(),
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.1,
    maxTokens: 2000,
  });

  const pipelineConfig: LayerPipelineConfig = {
    task,
    divergentAgents,
    inquisitorAgent,
    synthesizerAgent,
    orchestratorAgent,
    decayConfig: {
      maxIterations,
      baseTemperature: 0.8,
      temperatureIncrement: 0.05,
      temperatureCeiling: 1.0,
      promptMutationFactor: 0.3,
      tokenBudget,
      agentTimeoutMs: 60_000,
      minSurvivingAgents: 2,
    },
  };

  const engineConfig: PolarisEngineConfig = {
    task,
    agents: divergentAgents,
    mode: "pipeline",
    pipelineConfig,
  };

  const engine = new PolarisEngine(engineConfig);

  const state = PhilosophyUtils.createDiscussion(question, undefined, 20, 0.8);

  const output = await engine.inference({ state });

  const pipeline = output.pipelineResult as any;

  await engine.cleanup();

  return {
    question,
    finalOutput: pipeline?.finalOutput ?? output.agentOutputs[0]?.evaluation?.reasoning ?? "",
    totalIterations: pipeline?.totalIterations ?? 1,
    forcedDelivery: pipeline?.forcedDelivery ?? false,
    forcedDeliveryReason: pipeline?.forcedDeliveryReason,
    totalTokensConsumed: pipeline?.totalTokensConsumed ?? 0,
    lastVerdict: pipeline?.lastVerdict ?? null,
    iterationBreakdowns: pipeline?.iterationBreakdowns ?? [],
    agentOutputs: output.agentOutputs,
  };
}
