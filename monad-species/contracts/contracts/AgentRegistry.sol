// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPredictionMarket {
    function getPnL(uint256 epochId, uint256 agentId) external view returns (int256);
    function isResolved(uint256 epochId) external view returns (bool);
}

contract AgentRegistry {
    struct Agent {
        address owner;
        uint256 stake;
        int256 performance;
        bool alive;
    }

    // --- STATE ---

    address public owner;
    uint256 public nextAgentId;

    mapping(uint256 => Agent) public agents;

    // ✅ Whitelist market security
    mapping(address => bool) public approvedMarkets;

    // --- EVENTS ---

    event AgentCreated(uint256 indexed agentId, address indexed owner, uint256 stake);
    event PerformanceUpdated(uint256 indexed agentId, int256 newScore);
    event AgentSlashed(uint256 indexed agentId);
    event EpochSettled(uint256 indexed epochId, uint256 slashedAgentId, int256 slashedPerf);

    // ✅ Market approval event
    event MarketApproved(address indexed market, bool approved);

    // --- MODIFIERS ---

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // --- CONSTRUCTOR ---

    constructor() {
        owner = msg.sender;
    }

    // --- MARKET MANAGEMENT ---

    function approveMarket(address market, bool approved) external onlyOwner {
        require(market != address(0), "market=0");
        approvedMarkets[market] = approved;
        emit MarketApproved(market, approved);
    }

    // --- CORE LOGIC ---

    function createAgent() external payable {
        require(msg.value > 0, "Stake required");

        agents[nextAgentId] = Agent({
            owner: msg.sender,
            stake: msg.value,
            performance: 0,
            alive: true
        });

        emit AgentCreated(nextAgentId, msg.sender, msg.value);
        nextAgentId++;
    }

    function updatePerformance(uint256 agentId, int256 newScore) external onlyOwner {
        require(agents[agentId].alive, "Dead agent");
        agents[agentId].performance = newScore;
        emit PerformanceUpdated(agentId, newScore);
    }

    function slashAgent(uint256 agentId) public onlyOwner {
        require(agents[agentId].alive, "Already dead");

        agents[agentId].alive = false;
        agents[agentId].stake = 0;

        emit AgentSlashed(agentId);
    }

    // ✅ Keeper-style epoch settlement
    function settleEpoch(uint256 epochId, address market) external {
        require(market != address(0), "market=0");

        // ✅ SECURITY: only approved markets
        require(approvedMarkets[market], "Market not approved");

        // market resolved mı?
        require(
            IPredictionMarket(market).isResolved(epochId),
            "Epoch not resolved"
        );

        uint256 total = nextAgentId;

        bool found = false;
        uint256 worstId = 0;
        int256 worstPerf = 0;

        for (uint256 i = 0; i < total; i++) {
            if (!agents[i].alive) continue;

            int256 pnl = IPredictionMarket(market).getPnL(epochId, i);

            agents[i].performance = pnl;
            emit PerformanceUpdated(i, pnl);

            if (!found || pnl < worstPerf) {
                found = true;
                worstPerf = pnl;
                worstId = i;
            }
        }

        require(found, "No alive agents");

        // Slash worst performer
        agents[worstId].alive = false;
        agents[worstId].stake = 0;

        emit AgentSlashed(worstId);
        emit EpochSettled(epochId, worstId, worstPerf);
    }
}