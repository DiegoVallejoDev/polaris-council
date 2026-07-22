import { Router } from "express";
import { runCouncil } from "../council/engine.js";

const router = Router();

router.post("/debate", async (req, res) => {
  const { question, maxIterations, tokenBudget } = req.body;

  if (!question || typeof question !== "string") {
    res.status(400).json({ error: "question is required" });
    return;
  }

  try {
    const result = await runCouncil({
      question,
      maxIterations: maxIterations ?? 3,
      tokenBudget: tokenBudget ?? 100_000,
    });
    res.json(result);
  } catch (error) {
    console.error("Council failed:", error);
    res.status(500).json({ error: String(error) });
  }
});

export { router as councilRouter };
