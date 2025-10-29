// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Silent Kingdoms encrypted strategy game
/// @notice Players manage encrypted resources and construction choices using Zama FHE
contract SilentKingdoms is SepoliaConfig {
    uint32 public constant STARTING_GOLD = 1_000;
    uint32 public constant BARRACKS_COST = 100;
    uint32 public constant FARM_COST = 200;
    uint32 public constant FACTORY_COST = 300;
    uint32 public constant WALL_COST = 400;

    struct PlayerData {
        euint32 gold;
        euint32 lastBuilding;
        bool registered;
    }

    mapping(address => PlayerData) private _players;

    event PlayerJoined(address indexed player);
    event BuildingAttempted(address indexed player);

    /// @notice Register a new player and assign encrypted starting gold
    function joinGame() external {
        PlayerData storage player = _players[msg.sender];
        require(!player.registered, "Player already registered");

        euint32 startingGold = FHE.asEuint32(STARTING_GOLD);
        euint32 initialBuilding = FHE.asEuint32(0);

        player.registered = true;
        _storePlayerCiphertexts(player, startingGold, initialBuilding, msg.sender);

        emit PlayerJoined(msg.sender);
    }

    /// @notice Construct an encrypted building selection and update encrypted gold
    /// @param encryptedBuildingId The encrypted building identifier provided by the relayer
    /// @param inputProof Zama input proof tied to the encrypted value
    function constructBuilding(externalEuint32 encryptedBuildingId, bytes calldata inputProof) external {
        PlayerData storage player = _players[msg.sender];
        require(player.registered, "Player not registered");

        euint32 currentGold = player.gold;
        euint32 currentBuilding = player.lastBuilding;

        euint32 buildingId = FHE.fromExternal(encryptedBuildingId, inputProof);
        (euint32 buildingCost, ebool isKnownBuilding) = _resolveBuildingCost(buildingId);

        ebool canAfford = FHE.ge(currentGold, buildingCost);
        ebool shouldApply = FHE.and(isKnownBuilding, canAfford);

        euint32 zeroValue = FHE.asEuint32(0);
        euint32 appliedCost = FHE.select(shouldApply, buildingCost, zeroValue);
        euint32 updatedGold = FHE.sub(currentGold, appliedCost);
        euint32 updatedBuilding = FHE.select(shouldApply, buildingId, currentBuilding);

        _storePlayerCiphertexts(player, updatedGold, updatedBuilding, msg.sender);

        emit BuildingAttempted(msg.sender);
    }

    /// @notice Retrieve encrypted gold balance for a player
    /// @param playerAddress The player to query
    /// @return Encrypted gold balance as euint32
    function getPlayerGold(address playerAddress) external view returns (euint32) {
        PlayerData storage player = _players[playerAddress];
        require(player.registered, "Player not registered");
        return player.gold;
    }

    /// @notice Retrieve encrypted last constructed building for a player
    /// @param playerAddress The player to query
    /// @return Encrypted building identifier as euint32
    function getPlayerLastBuilding(address playerAddress) external view returns (euint32) {
        PlayerData storage player = _players[playerAddress];
        require(player.registered, "Player not registered");
        return player.lastBuilding;
    }

    /// @notice Retrieve encrypted state for a player
    /// @param playerAddress The player to query
    /// @return gold Encrypted gold balance
    /// @return lastBuilding Encrypted last building identifier
    /// @return registered Whether the player is registered
    function getPlayerState(address playerAddress)
        external
        view
        returns (euint32 gold, euint32 lastBuilding, bool registered)
    {
        PlayerData storage player = _players[playerAddress];
        require(player.registered, "Player not registered");
        return (player.gold, player.lastBuilding, player.registered);
    }

    /// @notice Check if a player has joined the game
    /// @param playerAddress The address to check
    function isPlayerRegistered(address playerAddress) external view returns (bool) {
        return _players[playerAddress].registered;
    }

    /// @notice Return the list of building prices
    function getBuildingPrices() external pure returns (uint32[4] memory) {
        return [BARRACKS_COST, FARM_COST, FACTORY_COST, WALL_COST];
    }

    function _resolveBuildingCost(euint32 buildingId) private returns (euint32 cost, ebool isValid) {
        ebool isBarracks = FHE.eq(buildingId, FHE.asEuint32(1));
        ebool isFarm = FHE.eq(buildingId, FHE.asEuint32(2));
        ebool isFactory = FHE.eq(buildingId, FHE.asEuint32(3));
        ebool isWall = FHE.eq(buildingId, FHE.asEuint32(4));

        euint32 selectedCost = FHE.asEuint32(0);
        selectedCost = FHE.select(isBarracks, FHE.asEuint32(BARRACKS_COST), selectedCost);
        selectedCost = FHE.select(isFarm, FHE.asEuint32(FARM_COST), selectedCost);
        selectedCost = FHE.select(isFactory, FHE.asEuint32(FACTORY_COST), selectedCost);
        selectedCost = FHE.select(isWall, FHE.asEuint32(WALL_COST), selectedCost);

        ebool validPair = FHE.or(FHE.or(isBarracks, isFarm), FHE.or(isFactory, isWall));
        return (selectedCost, validPair);
    }

    function _storePlayerCiphertexts(
        PlayerData storage player,
        euint32 goldCipher,
        euint32 buildingCipher,
        address playerAddress
    ) private {
        player.gold = goldCipher;
        player.lastBuilding = buildingCipher;

        FHE.allowThis(player.gold);
        FHE.allow(player.gold, playerAddress);

        FHE.allowThis(player.lastBuilding);
        FHE.allow(player.lastBuilding, playerAddress);
    }
}
