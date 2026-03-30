// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FoodTrace {

    enum Stage { FARM, TRANSPORT, RETAIL }

    struct Event {
        Stage stage;
        string location;
        uint timestamp;
        address handler;
    }

    struct Batch {
        uint id;
        string name;
        string origin;
        address currentOwner;
        Event[] history;
    }

    mapping(uint => Batch) public batches;

    // Create batch (Farmer)
    function createBatch(
        uint _id,
        string memory _name,
        string memory _origin
    ) public {

        Batch storage b = batches[_id];
        b.id = _id;
        b.name = _name;
        b.origin = _origin;
        b.currentOwner = msg.sender;

        b.history.push(Event({
            stage: Stage.FARM,
            location: _origin,
            timestamp: block.timestamp,
            handler: msg.sender
        }));
    }

    // Update batch location (Transport / Retail)
    function updateBatch(
        uint _id,
        Stage _stage,
        string memory _location
    ) public {

        Batch storage b = batches[_id];

        b.currentOwner = msg.sender;

        b.history.push(Event({
            stage: _stage,
            location: _location,
            timestamp: block.timestamp,
            handler: msg.sender
        }));
    }

    // Get batch basic info
    function getBatch(uint _id)
    public view returns (
        uint,
        string memory,
        string memory,
        address
    ) {
        Batch storage b = batches[_id];
        return (b.id, b.name, b.origin, b.currentOwner);
    }

    // Get history count
    function getHistoryLength(uint _id)
    public view returns (uint) {
        return batches[_id].history.length;
    }

    // Get specific event
    function getEvent(uint _id, uint index)
    public view returns (
        Stage,
        string memory,
        uint,
        address
    ) {
        Event storage e = batches[_id].history[index];
        return (e.stage, e.location, e.timestamp, e.handler);
    }
}