// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Treasury {
    address public governor;
    address public owner;

    event GovernorSet(address indexed governor);
    event Sent(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyGovernor() {
        require(msg.sender == governor, "ONLY_GOVERNOR");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function setGovernor(address _governor) external onlyOwner {
        require(_governor != address(0), "BAD_GOVERNOR");
        governor = _governor;
        emit GovernorSet(_governor);
    }

    function sendTo(address payable to, uint256 amount) external onlyGovernor {
        require(to != address(0), "BAD_TO");
        require(amount > 0, "BAD_AMOUNT");
        require(address(this).balance >= amount, "TREASURY_EMPTY");

        // effects -> interactions (no state to change here besides event)
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "TRANSFER_FAIL");

        emit Sent(to, amount);
    }
}