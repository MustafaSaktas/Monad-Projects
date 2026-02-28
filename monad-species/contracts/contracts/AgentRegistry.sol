// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {

    struct Agent {
        address owner;
        uint256 stake;
        uint256 performance;
        bool alive;
    }

    // --- STATE ---

    address public owner;
    uint256 public nextAgentId;

    mapping(uint256 => Agent) public agents;

    // --- EVENTS ---

    event AgentCreated(uint256 indexed agentId, address indexed owner, uint256 stake);
    event PerformanceUpdated(uint256 indexed agentId, uint256 newScore);
    event AgentSlashed(uint256 indexed agentId);

    // --- MODIFIERS ---

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // --- CONSTRUCTOR ---

    constructor() {
        owner = msg.sender;
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

    function updatePerformance(uint256 agentId, uint256 newScore) external onlyOwner {
        require(agents[agentId].alive, "Dead agent");

        agents[agentId].performance = newScore;

        emit PerformanceUpdated(agentId, newScore);
    }

    function slashAgent(uint256 agentId) external onlyOwner {
        require(agents[agentId].alive, "Already dead");

        agents[agentId].alive = false;
        agents[agentId].stake = 0;

        emit AgentSlashed(agentId);
    }
}