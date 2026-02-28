// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PredictionMarket.sol";
import "./Treasury.sol";

contract Governor {
    struct Proposal {
        uint256 id;
        string description;
        address payable recipient;
        uint256 amount;
        uint64 deadline;
        bool executed;
        uint256 marketId;
    }

    address public owner;
    uint256 public nextProposalId;
    uint256 public minYesBpsToExecute; // e.g. 6000 = 60%

    PredictionMarket public pm;
    Treasury public treasury;

    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed marketId,
        address indexed recipient,
        uint256 amount,
        uint64 deadline
    );
    event Executed(uint256 indexed proposalId, address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor(address _pm, address payable _treasury, uint256 _minYesBps) {
        require(_pm != address(0) && _treasury != address(0), "BAD_ADDR");
        require(_minYesBps <= 10000, "BAD_BPS");

        owner = msg.sender;
        pm = PredictionMarket(_pm);
        treasury = Treasury(_treasury);
        minYesBpsToExecute = _minYesBps;
    }

    function setMinYesBps(uint256 bps) external onlyOwner {
        require(bps <= 10000, "BAD_BPS");
        minYesBpsToExecute = bps;
    }

    function propose(
        string calldata description,
        address payable recipient,
        uint256 amount,
        uint64 deadline,
        uint64 marketCloseTime
    ) external onlyOwner returns (uint256 proposalId, uint256 marketId) {
        require(recipient != address(0), "BAD_RECIPIENT");
        require(amount > 0, "BAD_AMOUNT");
        require(deadline > block.timestamp, "BAD_DEADLINE");
        require(marketCloseTime > block.timestamp, "BAD_CLOSE");

        require(deadline > marketCloseTime, "DEADLINE_BEFORE_CLOSE");

        marketId = pm.createMarket(marketCloseTime);

        proposalId = nextProposalId++;
        proposals[proposalId] = Proposal({
            id: proposalId,
            description: description,
            recipient: recipient,
            amount: amount,
            deadline: deadline,
            executed: false,
            marketId: marketId
        });

        emit ProposalCreated(proposalId, marketId, recipient, amount, deadline);
    }

    function canExecute(uint256 proposalId) public view returns (bool) {
        Proposal storage p = proposals[proposalId];
        if (p.recipient == address(0)) return false; // not exists
        if (p.executed) return false;
        if (block.timestamp < p.deadline) return false;

        uint256 yesBps = pm.priceYesBps(p.marketId);
        if (yesBps < minYesBpsToExecute) return false;

        return true;
    }

    function execute(uint256 proposalId) external {
        require(canExecute(proposalId), "CANNOT_EXECUTE");

        Proposal storage p = proposals[proposalId];
        p.executed = true; // effects

        treasury.sendTo(p.recipient, p.amount); // interaction

        emit Executed(proposalId, p.recipient, p.amount);
    }

    /// MVP: outcome'ı manuel resolve ediyoruz (demo için)
    function resolveMarket(uint256 proposalId, bool outcomeYes) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(p.recipient != address(0), "BAD_ID");
        pm.resolve(p.marketId, outcomeYes);
    }
}