import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployAIGovernor", (m) => {
  const treasury = m.contract("Treasury");
  const pm = m.contract("PredictionMarket");

  const minYesBps = 6000n;
  const gov = m.contract("Governor", [pm, treasury, minYesBps]);

  m.call(pm, "setResolver", [gov]);
  m.call(treasury, "setGovernor", [gov]);

  return { treasury, pm, gov };
});