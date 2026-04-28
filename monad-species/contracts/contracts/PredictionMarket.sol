// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentRegistryView {
    function agents(uint256 agentId) external view returns (address owner, uint256 stake, int256 performance, bool alive);
}

contract PredictionMarket {
    address public owner;
    address public registry;

    struct Epoch {
        uint256 endBlock;
        bool resolved;
        bool outcomeYes; // true = YES
    }

    struct Bet {
        bool placed;
        bool sideYes;
        uint256 amount;
        bool claimed;
    }

    mapping(uint256 => Epoch) public epochs; // epochId -> epoch
    mapping(uint256 => mapping(uint256 => Bet)) public bets; // epochId -> agentId -> bet

    event EpochCreated(uint256 indexed epochId, uint256 endBlock);
    event BetPlaced(uint256 indexed epochId, uint256 indexed agentId, bool sideYes, uint256 amount);
    event EpochResolved(uint256 indexed epochId, bool outcomeYes);
    event Claimed(uint256 indexed epochId, uint256 indexed agentId, uint256 payout);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address registry_) {
        owner = msg.sender;
        registry = registry_;
    }

    function createEpoch(uint256 epochId, uint256 endBlock) external onlyOwner {
        require(epochs[epochId].endBlock == 0, "Epoch exists");
        require(endBlock > block.number, "endBlock must be future");
        epochs[epochId] = Epoch({ endBlock: endBlock, resolved: false, outcomeYes: false });
        emit EpochCreated(epochId, endBlock);
    }

    function placeBet(uint256 epochId, uint256 agentId, bool sideYes) external payable {
        Epoch memory e = epochs[epochId];
        require(e.endBlock != 0, "Epoch missing");
        require(block.number < e.endBlock, "Epoch ended");
        require(msg.value > 0, "No value");

        (address agentOwner,, , bool alive) = IAgentRegistryView(registry).agents(agentId);
        require(alive, "Agent dead");
        require(agentOwner == msg.sender, "Not agent owner");

        Bet storage b = bets[epochId][agentId];
        require(!b.placed, "Already placed");

        b.placed = true;
        b.sideYes = sideYes;
        b.amount = msg.value;
        b.claimed = false;

        emit BetPlaced(epochId, agentId, sideYes, msg.value);
    }

    function resolveEpoch(uint256 epochId, bool outcomeYes) external onlyOwner {
        Epoch storage e = epochs[epochId];
        require(e.endBlock != 0, "Epoch missing");
        require(block.number >= e.endBlock, "Not ended");
        require(!e.resolved, "Already resolved");

        e.resolved = true;
        e.outcomeYes = outcomeYes;

        emit EpochResolved(epochId, outcomeYes);
    }

    function isResolved(uint256 epochId) external view returns (bool) {
        return epochs[epochId].resolved;
    }

    // Fixed-odds MVP:
    // - doğruysa payout = 2*amount, yanlışsa payout = 0
    // PnL = payout - amount  => doğruysa +amount, yanlışsa -amount
    function getPnL(uint256 epochId, uint256 agentId) external view returns (int256) {
        Epoch memory e = epochs[epochId];
        if (!e.resolved) return 0;

        Bet memory b = bets[epochId][agentId];
        if (!b.placed) return 0;

        bool win = (b.sideYes == e.outcomeYes);
        int256 amt = int256(uint256(b.amount));
        if (win) return amt;     // +amount
        return -amt;             // -amount
    }

    function claim(uint256 epochId, uint256 agentId) external {
        Epoch memory e = epochs[epochId];
        require(e.resolved, "Not resolved");

        Bet storage b = bets[epochId][agentId];
        require(b.placed, "No bet");
        require(!b.claimed, "Claimed");

        (address agentOwner,, , ) = IAgentRegistryView(registry).agents(agentId);
        require(msg.sender == agentOwner, "Not agent owner");

        bool win = (b.sideYes == e.outcomeYes);
        uint256 payout = win ? (2 * b.amount) : 0;
        b.claimed = true;

        if (payout > 0) {
            (bool ok,) = agentOwner.call{value: payout}("");
            require(ok, "Transfer failed");
        }

        emit Claimed(epochId, agentId, payout);
    }

    receive() external payable {}
}