// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PredictionMarket {
    struct Market {
        uint256 yesPool;
        uint256 noPool;
        uint64 closeTime;
        bool resolved;
        bool outcomeYes;
    }

    address public owner;
    address public resolver; // Governor set eder
    uint256 public nextMarketId;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event MarketCreated(uint256 indexed id, uint64 closeTime);
    event BetPlaced(uint256 indexed id, address indexed user, bool yes, uint256 amount);
    event Resolved(uint256 indexed id, bool outcomeYes);
    event Claimed(uint256 indexed id, address indexed user, uint256 payout);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyResolver() {
        require(msg.sender == resolver, "ONLY_RESOLVER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setResolver(address _resolver) external onlyOwner {
        require(_resolver != address(0), "BAD_RESOLVER");
        resolver = _resolver;
    }

    function createMarket(uint64 closeTime) external onlyResolver returns (uint256 id) {
        require(closeTime > block.timestamp, "CLOSE_IN_PAST");
        id = nextMarketId++;
        markets[id] = Market({
            yesPool: 0,
            noPool: 0,
            closeTime: closeTime,
            resolved: false,
            outcomeYes: false
        });
        emit MarketCreated(id, closeTime);
    }

    function betYes(uint256 id) external payable {
        _bet(id, true);
    }

    function betNo(uint256 id) external payable {
        _bet(id, false);
    }

    function _bet(uint256 id, bool yes) internal {
        require(msg.value > 0, "NO_VALUE");
        Market storage m = markets[id];
        require(m.closeTime != 0 || id == 0, "BAD_ID"); // id=0 closeTime set olur; m.closeTime=0 sadece hiç yaratılmadıysa kalır
        require(block.timestamp < m.closeTime, "MARKET_CLOSED");
        require(!m.resolved, "ALREADY_RESOLVED");

        if (yes) {
            m.yesPool += msg.value;
            yesBets[id][msg.sender] += msg.value;
        } else {
            m.noPool += msg.value;
            noBets[id][msg.sender] += msg.value;
        }

        emit BetPlaced(id, msg.sender, yes, msg.value);
    }

    /// @return bps 0..10000 (yesPool / total)
    function priceYesBps(uint256 id) public view returns (uint256 bps) {
        Market storage m = markets[id];
        require(m.closeTime != 0 || id == 0, "BAD_ID");
        uint256 total = m.yesPool + m.noPool;
        if (total == 0) return 0;
        return (m.yesPool * 10000) / total;
    }

    function resolve(uint256 id, bool outcomeYes) external onlyResolver {
        Market storage m = markets[id];
        require(m.closeTime != 0 || id == 0, "BAD_ID");
        require(!m.resolved, "ALREADY_RESOLVED");
        require(block.timestamp >= m.closeTime, "TOO_EARLY");

        m.resolved = true;
        m.outcomeYes = outcomeYes;

        emit Resolved(id, outcomeYes);
    }

    function claim(uint256 id) external returns (uint256 payout) {
        Market storage m = markets[id];
        require(m.resolved, "NOT_RESOLVED");
        require(!claimed[id][msg.sender], "ALREADY_CLAIMED");

        claimed[id][msg.sender] = true; // effects

        uint256 total = m.yesPool + m.noPool;
        uint256 winnerPool = m.outcomeYes ? m.yesPool : m.noPool;
        uint256 userStake = m.outcomeYes ? yesBets[id][msg.sender] : noBets[id][msg.sender];

        if (winnerPool == 0 || userStake == 0) {
            // payout = 0
            emit Claimed(id, msg.sender, 0);
            return 0;
        }

        payout = (total * userStake) / winnerPool;

        (bool ok, ) = msg.sender.call{value: payout}("");
        require(ok, "PAYOUT_FAIL");

        emit Claimed(id, msg.sender, payout);
    }
}