import type { Address } from 'viem';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

// Replace with the deployed SilentKingdoms address on Sepolia when available
export const CONTRACT_ADDRESS = ZERO_ADDRESS;

export const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "BuildingAttempted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "PlayerJoined",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BARRACKS_COST",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FACTORY_COST",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FARM_COST",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "STARTING_GOLD",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WALL_COST",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "encryptedBuildingId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "constructBuilding",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBuildingPrices",
    "outputs": [
      {
        "internalType": "uint32[4]",
        "name": "",
        "type": "uint32[4]"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "playerAddress",
        "type": "address"
      }
    ],
    "name": "getPlayerGold",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "playerAddress",
        "type": "address"
      }
    ],
    "name": "getPlayerLastBuilding",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "playerAddress",
        "type": "address"
      }
    ],
    "name": "getPlayerState",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "gold",
        "type": "uint32"
      },
      {
        "internalType": "euint32",
        "name": "lastBuilding",
        "type": "uint32"
      },
      {
        "internalType": "bool",
        "name": "registered",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "playerAddress",
        "type": "address"
      }
    ],
    "name": "isPlayerRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const BUILDINGS = [
  { id: 1, name: 'Barracks' },
  { id: 2, name: 'Farm' },
  { id: 3, name: 'Factory' },
  { id: 4, name: 'Wall' },
] as const;
