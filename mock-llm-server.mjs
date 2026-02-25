import { createServer } from "node:http";

const MOCK_RESPONSE = {
  title: "Universal Basic Income",
  description: "Should governments implement a universal basic income (UBI)?",
  nodes: [
    { id: "n1", type: "Policy", position: { x: 0, y: 0 }, data: { nodeType: "Policy", label: "Implement Universal Basic Income", notes: "A policy proposal to provide all citizens with a regular, unconditional cash payment.", status: "Unsupported", scope: "National" } },
    { id: "n2", type: "FactualClaim", position: { x: 0, y: 0 }, data: { nodeType: "FactualClaim", label: "Poverty rates remain high despite existing welfare programs", notes: "Current means-tested programs fail to reach all those in need.", status: "Unsupported", sources: ["World Bank 2023 Report"] } },
    { id: "n3", type: "CausalClaim", position: { x: 0, y: 0 }, data: { nodeType: "CausalClaim", label: "UBI would reduce poverty and financial insecurity", notes: "Direct cash transfers lift people above the poverty line.", status: "Unsupported", mechanism: "Unconditional cash transfers provide a financial floor for all citizens", sources: ["GiveDirectly RCTs"] } },
    { id: "n4", type: "Evidence", position: { x: 0, y: 0 }, data: { nodeType: "Evidence", label: "Finland UBI experiment (2017–2018)", notes: "Participants reported improved well-being and modest employment effects.", status: "Unsupported", sourceType: "study", citation: "Kangas et al., 2020. The Basic Income Experiment in Finland.", url: "" } },
    { id: "n5", type: "Evidence", position: { x: 0, y: 0 }, data: { nodeType: "Evidence", label: "Stockton SEED program showed positive outcomes", notes: "Recipients found full-time employment at higher rates than the control group.", status: "Unsupported", sourceType: "study", citation: "West & Castro, 2021. Stockton Economic Empowerment Demonstration.", url: "" } },
    { id: "n6", type: "CausalClaim", position: { x: 0, y: 0 }, data: { nodeType: "CausalClaim", label: "UBI would discourage work and reduce labor supply", notes: "Critics argue unconditional payments reduce the incentive to seek employment.", status: "Unsupported", mechanism: "Reduced financial pressure to work lowers labor force participation", sources: [] } },
    { id: "n7", type: "FactualClaim", position: { x: 0, y: 0 }, data: { nodeType: "FactualClaim", label: "UBI would cost trillions annually at a national scale", notes: "Estimated $3+ trillion per year in the US for a meaningful UBI.", status: "Unsupported", sources: ["Congressional Budget Office estimates"] } },
    { id: "n8", type: "Assumption", position: { x: 0, y: 0 }, data: { nodeType: "Assumption", label: "People will use cash transfers productively", notes: "Assumes recipients will spend on necessities rather than harmful goods.", status: "Unsupported", isExplicit: true } },
    { id: "n9", type: "Value", position: { x: 0, y: 0 }, data: { nodeType: "Value", label: "Economic freedom and individual autonomy", notes: "UBI respects individual choice in how to meet their needs.", status: "Unsupported", domain: "Ethics" } },
    { id: "n10", type: "Value", position: { x: 0, y: 0 }, data: { nodeType: "Value", label: "Fiscal responsibility and sustainability", notes: "Government spending should be targeted and sustainable.", status: "Unsupported", domain: "Economics" } },
    { id: "n11", type: "CausalClaim", position: { x: 0, y: 0 }, data: { nodeType: "CausalClaim", label: "UBI simplifies welfare bureaucracy and reduces admin costs", notes: "Replacing means-tested programs with a single universal payment.", status: "Unsupported", mechanism: "Elimination of complex eligibility checks and multiple program overhead", sources: [] } },
    { id: "n12", type: "Assumption", position: { x: 0, y: 0 }, data: { nodeType: "Assumption", label: "Automation will displace a significant portion of jobs", notes: "Assumes technological unemployment will make UBI necessary.", status: "Unsupported", isExplicit: false } },
  ],
  edges: [
    { id: "e1", source: "n2", target: "n1", type: "Supports", data: { edgeType: "Supports", notes: "High poverty rates justify a new approach" } },
    { id: "e2", source: "n3", target: "n1", type: "Supports", data: { edgeType: "Supports", notes: "Core causal argument for UBI" } },
    { id: "e3", source: "n4", target: "n3", type: "Supports", data: { edgeType: "Supports", notes: "Empirical evidence for UBI benefits" } },
    { id: "e4", source: "n5", target: "n3", type: "Supports", data: { edgeType: "Supports", notes: "US-based evidence for UBI benefits" } },
    { id: "e5", source: "n6", target: "n1", type: "Undermines", data: { edgeType: "Undermines", notes: "Work disincentive argument against UBI" } },
    { id: "e6", source: "n5", target: "n6", type: "Undermines", data: { edgeType: "Undermines", notes: "Stockton results contradict work disincentive claim" } },
    { id: "e7", source: "n7", target: "n1", type: "Undermines", data: { edgeType: "Undermines", notes: "Fiscal cost challenges feasibility" } },
    { id: "e8", source: "n11", target: "n7", type: "Undermines", data: { edgeType: "Undermines", notes: "Admin savings partially offset the cost" } },
    { id: "e9", source: "n8", target: "n3", type: "DependsOn", data: { edgeType: "DependsOn", notes: "Poverty reduction assumes productive use of funds" } },
    { id: "e10", source: "n9", target: "n1", type: "Supports", data: { edgeType: "Supports", notes: "UBI aligns with autonomy values" } },
    { id: "e11", source: "n10", target: "n7", type: "Supports", data: { edgeType: "Supports", notes: "Fiscal responsibility reinforces cost concerns" } },
    { id: "e12", source: "n12", target: "n1", type: "Supports", data: { edgeType: "Supports", notes: "Automation threat strengthens case for UBI" } },
    { id: "e13", source: "n9", target: "n10", type: "Contradicts", data: { edgeType: "Contradicts", notes: "Individual freedom vs fiscal prudence tension" } },
  ],
};

const server = createServer((req, res) => {
  // CORS headers for browser requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    // Simulate a small delay
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        id: "chatcmpl-mock-001",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "mock-llm",
        choices: [{
          index: 0,
          message: { role: "assistant", content: JSON.stringify(MOCK_RESPONSE) },
          finish_reason: "stop",
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      }));
    }, 1500);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: { message: "Not found" } }));
});

server.listen(11435, () => {
  console.log("Mock LLM server running at http://localhost:11435/v1");
  console.log("Use base URL: http://localhost:11435/v1");
  console.log("Model: mock-llm (or anything)");
  console.log("API Key: (leave empty)");
  console.log("\nPress Ctrl+C to stop.");
});
