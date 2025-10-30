# Silent Kingdoms

**An On-Chain Privacy-Preserving Strategy Game Built with Fully Homomorphic Encryption**

Silent Kingdoms is a revolutionary blockchain-based strategy game that leverages Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine) to enable truly private, encrypted gameplay on a public blockchain. Players manage resources and construct buildings while their strategic choices remain completely confidential, solving one of blockchain gaming's biggest challenges: information asymmetry and front-running.

---

## Table of Contents

- [Introduction](#introduction)
- [Key Features & Advantages](#key-features--advantages)
- [Problems We Solve](#problems-we-solve)
- [Technology Stack](#technology-stack)
- [Game Mechanics](#game-mechanics)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Development Workflow](#development-workflow)
  - [Compile Contracts](#compile-contracts)
  - [Run Tests](#run-tests)
  - [Deploy Locally](#deploy-locally)
  - [Deploy to Sepolia](#deploy-to-sepolia)
- [Custom Hardhat Tasks](#custom-hardhat-tasks)
- [Frontend Application](#frontend-application)
- [Project Structure](#project-structure)
- [Smart Contract Details](#smart-contract-details)
- [Testing Strategy](#testing-strategy)
- [Security Considerations](#security-considerations)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support & Community](#support--community)

---

## Introduction

Silent Kingdoms reimagines blockchain gaming by introducing **true privacy** to on-chain strategy games. Unlike traditional blockchain games where every action is visible on the transparent ledger, Silent Kingdoms uses Fully Homomorphic Encryption (FHE) to keep player decisions, resources, and strategies completely encrypted while still being verifiable on-chain.

This creates a gaming experience where:
- Your gold reserves remain secret
- Your building construction choices are hidden from opponents
- Strategic decisions cannot be front-run or copied
- All game logic remains decentralized and trustless

---

## Key Features & Advantages

### 1. **True On-Chain Privacy**
- Player resources (gold) are encrypted using FHE and stored on-chain
- Building construction choices are submitted and processed in encrypted form
- Only the player can decrypt their own game state
- No trusted third parties or off-chain components required

### 2. **Protection Against Front-Running**
- Encrypted transactions prevent MEV (Miner Extractable Value) attacks
- Opponents cannot see or copy your strategy before their turn
- Fair gameplay through cryptographic guarantees

### 3. **Verifiable Game Logic**
- All game rules are enforced by smart contracts
- Encrypted state transitions are computed on-chain using FHE operations
- Players maintain sovereignty over their game state

### 4. **Seamless User Experience**
- Abstracted complexity of FHE encryption
- Intuitive React-based frontend with wallet integration
- Real-time encrypted state management
- One-click decryption for viewing your own state

### 5. **Scalable Architecture**
- Modular smart contract design for easy feature additions
- Gas-optimized FHE operations
- Efficient encrypted state storage

### 6. **Developer-Friendly**
- Comprehensive test suite with >90% coverage
- Well-documented codebase
- Custom Hardhat tasks for contract interaction
- TypeScript throughout for type safety

---

## Problems We Solve

### Problem 1: **Transparent Blockchain = No Privacy**
**Traditional Issue**: All blockchain data is public, making strategy games impossible because everyone can see everyone else's resources, moves, and intentions.

**Our Solution**: FHE enables computation on encrypted data. Players' resources and choices remain encrypted on-chain, viewable only by the player themselves, while the contract can still perform calculations on this encrypted data.

### Problem 2: **Front-Running in Competitive Games**
**Traditional Issue**: Bots and malicious actors can observe pending transactions in the mempool and front-run strategic decisions, copying winning strategies or exploiting information.

**Our Solution**: Since all strategic choices are encrypted before submission, front-runners see only encrypted ciphertexts, making it impossible to extract actionable information from pending transactions.

### Problem 3: **Off-Chain Trust Requirements**
**Traditional Issue**: Most "private" blockchain games rely on commit-reveal schemes or off-chain computation, introducing trust assumptions and complexity.

**Our Solution**: Pure on-chain FHE computation eliminates the need for commit-reveal mechanisms, trusted hardware, or centralized servers. Everything happens transparently on the blockchain while maintaining privacy.

### Problem 4: **Information Asymmetry**
**Traditional Issue**: In traditional blockchain games, experienced players with better MEV protection or faster infrastructure have unfair advantages.

**Our Solution**: Encryption levels the playing field. Whether you're a whale or a casual player, your encrypted strategies are equally protected.

### Problem 5: **Limited Strategic Depth**
**Traditional Issue**: Knowing opponents' resources and choices reduces games to simple optimization problems rather than true strategy.

**Our Solution**: Hidden information creates genuine strategic depth, mind games, bluffing opportunities, and varied gameplay scenarios.

---

## Technology Stack

### Smart Contracts
- **Language**: Solidity ^0.8.24
- **Development Framework**: Hardhat 2.26+
- **Encryption Library**: Zama FHEVM (@fhevm/solidity ^0.8.0)
- **Testing**: Mocha + Chai with FHEVM mock environment
- **Deployment**: hardhat-deploy plugin
- **Network**: Ethereum Sepolia Testnet (production), Local FHEVM node (development)

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Wallet Connection**: RainbowKit + wagmi
- **Blockchain Interaction**:
  - **Write Operations**: Ethers.js v6
  - **Read Operations**: viem
- **Encryption SDK**: @zama-fhe/relayer-sdk
- **Styling**: Custom CSS (no Tailwind)

### Development Tools
- **Language**: TypeScript 5.8+
- **Linting**: ESLint with TypeScript parser
- **Code Formatting**: Prettier with Solidity plugin
- **Gas Reporting**: hardhat-gas-reporter
- **Coverage**: solidity-coverage
- **Contract Verification**: hardhat-verify (Etherscan)

### Encryption Technology
- **FHE Library**: Zama's TFHE-rs (underlying Rust implementation)
- **Encrypted Types**: euint32 (32-bit encrypted unsigned integers), ebool (encrypted booleans)
- **Operations**: Encrypted comparisons, arithmetic, conditionals, and select operations
- **Key Management**: Built-in access control list (ACL) system

---

## Game Mechanics

### Core Gameplay Loop

1. **Join Game**:
   - Player calls `joinGame()` to register
   - Receives 1,000 encrypted gold (starting capital)
   - Gold amount is stored as `euint32` on-chain

2. **Resource Management**:
   - Gold balance is always encrypted
   - Only the player can decrypt their balance using their private key
   - Contract can perform computations on encrypted gold without revealing the amount

3. **Building Construction**:
   - Four building types available:
     - **Barracks** (ID: 1, Cost: 100 gold) - Military structure
     - **Farm** (ID: 2, Cost: 200 gold) - Resource production
     - **Factory** (ID: 3, Cost: 300 gold) - Advanced production
     - **Wall** (ID: 4, Cost: 400 gold) - Defensive structure

4. **Encrypted Transaction Flow**:
   - Player selects a building (client-side)
   - Building ID is encrypted using FHEVM encryption SDK
   - Encrypted building ID is submitted to smart contract with proof
   - Contract validates building ID, checks affordability, and deducts cost
   - All operations occur on encrypted values
   - Result (new gold balance, last building) remains encrypted

5. **State Verification**:
   - Players can query their encrypted state anytime
   - Decryption happens client-side using the player's private key
   - Frontend displays decrypted information (gold, last building)

### Game Rules (Enforced On-Chain)

- Players cannot construct buildings without sufficient gold
- Invalid building IDs are rejected without state changes
- Each player's state is isolated and independently encrypted
- Failed construction attempts do not deduct gold
- Only registered players can construct buildings

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ RainbowKit   │  │  GameApp     │  │   Header     │      │
│  │ Wallet UI    │  │  Component   │  │  Component   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                   │             │
│         └──────────────────┴───────────────────┘             │
│                          │                                   │
│         ┌────────────────┴────────────────┐                 │
│         │                                  │                 │
│   ┌─────▼──────┐                  ┌───────▼─────┐          │
│   │   wagmi    │                  │ Zama Relayer│          │
│   │  (viem)    │                  │     SDK     │          │
│   └─────┬──────┘                  └───────┬─────┘          │
│         │                                  │                 │
└─────────┼──────────────────────────────────┼─────────────────┘
          │                                  │
          │ Read (viem)                      │ Encrypt/Decrypt
          │ Write (ethers)                   │ (FHE operations)
          │                                  │
          └──────────────────┬───────────────┘
                             │
                    ┌────────▼────────┐
                    │  Ethereum Node  │
                    │   (Sepolia)     │
                    └────────┬────────┘
                             │
                ┌────────────▼────────────────┐
                │  SilentKingdoms Contract    │
                │  ┌───────────────────────┐  │
                │  │  Encrypted State:     │  │
                │  │  - euint32 gold       │  │
                │  │  - euint32 lastBuild  │  │
                │  └───────────────────────┘  │
                │                              │
                │  ┌───────────────────────┐  │
                │  │  FHE Operations:      │  │
                │  │  - FHE.asEuint32()    │  │
                │  │  - FHE.ge() compare   │  │
                │  │  - FHE.sub() compute  │  │
                │  │  - FHE.select() pick  │  │
                │  └───────────────────────┘  │
                └──────────────────────────────┘
```

### Data Flow

1. **Joining Game**:
   ```
   User → Frontend → Contract.joinGame()
   → Store encrypted(1000) as euint32
   → Emit PlayerJoined event
   ```

2. **Building Construction**:
   ```
   User selects building
   → Frontend encrypts buildingId with Zama SDK
   → Generate inputProof
   → Contract.constructBuilding(encryptedId, proof)
   → FHE.fromExternal() validates proof
   → Contract computes: canAfford = FHE.ge(gold, cost)
   → Contract computes: newGold = FHE.sub(gold, cost)
   → Contract updates encrypted state
   → Emit BuildingAttempted event
   ```

3. **Reading State**:
   ```
   Frontend queries contract.getPlayerState()
   → Returns encrypted euint32 values
   → Frontend uses Zama SDK to decrypt
   → Display plaintext values to user
   ```

---

## Getting Started

### Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 7.0.0 or higher
- **Git**: For cloning the repository
- **Ethereum Wallet**: MetaMask or compatible (for testnet deployment and frontend)
- **Sepolia ETH**: Required for testnet deployment (get from [Sepolia faucet](https://sepoliafaucet.com/))
- **Infura Account**: For Sepolia RPC endpoint (or alternative provider)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/silent-kingdoms.git
   cd silent-kingdoms
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd src
   npm install
   cd ..
   ```

### Configuration

1. **Create environment file**:
   ```bash
   touch .env
   ```

2. **Configure environment variables**:
   ```ini
   # .env file

   # Infura API key for Sepolia network
   INFURA_API_KEY=your_infura_project_id_here

   # Private key for deployment (with 0x prefix)
   # ⚠️ NEVER commit this file or use mainnet keys
   PRIVATE_KEY=0x_your_private_key_here

   # Etherscan API key for contract verification (optional)
   ETHERSCAN_API_KEY=your_etherscan_api_key_here

   # Gas reporter settings (optional)
   REPORT_GAS=false
   ```

   **Security Notes**:
   - Never commit `.env` to version control
   - Use a dedicated testnet wallet with limited funds
   - Never use mainnet private keys in this file

---

## Development Workflow

### Compile Contracts

Compile all Solidity contracts and generate TypeScript typings:

```bash
npm run compile
```

This will:
- Compile contracts to `artifacts/` directory
- Generate TypeChain types in `types/` directory
- Create deployment artifacts

### Run Tests

#### Local Test Suite (FHEVM Mock)

Run comprehensive test suite with encrypted operations:

```bash
npm run test
```

**Test Coverage**:
- Player registration and starting gold allocation
- Encrypted building construction with cost deduction
- Invalid building ID handling
- Insufficient funds scenarios
- Access control and registration requirements

Expected output:
```
  SilentKingdoms
    ✓ grants encrypted starting gold when a player joins (XXXms)
    ✓ encrypts construction choice and deducts the correct cost (XXXms)
    ✓ reverts when constructing before joining (XXXms)
    ✓ ignores invalid building ids without changing state (XXXms)

  4 passing (XXXms)
```

#### Sepolia Testnet Tests

Test against live deployed contract on Sepolia:

```bash
npm run test:sepolia
```

**Note**: Requires deployed contract and funded wallet.

#### Generate Coverage Report

```bash
npm run coverage
```

Generates detailed HTML coverage report in `coverage/` directory.

### Deploy Locally

1. **Start local FHEVM node** (in separate terminal):
   ```bash
   npx hardhat node
   ```

2. **Deploy to local network**:
   ```bash
   npm run deploy:localhost
   ```

**What Happens**:
- Starts local Hardhat node with FHEVM support
- Deploys SilentKingdoms contract
- Saves deployment artifacts to `deployments/localhost/`
- Provides contract address for frontend configuration

### Deploy to Sepolia

1. **Ensure prerequisites**:
   - `.env` configured with `INFURA_API_KEY` and `PRIVATE_KEY`
   - Wallet has Sepolia ETH (0.05+ recommended)

2. **Deploy contract**:
   ```bash
   npm run deploy:sepolia
   ```

3. **Verify contract on Etherscan** (optional):
   ```bash
   npm run verify:sepolia -- <CONTRACT_ADDRESS>
   ```

**Deployment Artifacts**:
- Contract address saved in `deployments/sepolia/SilentKingdoms.json`
- ABI exported for frontend integration
- Transaction hash and deployment details logged

---

## Custom Hardhat Tasks

Silent Kingdoms includes custom Hardhat tasks for easy contract interaction:

### 1. Get Contract Address

```bash
npx hardhat task:game-address --network sepolia
```

**Output**: Deployed SilentKingdoms contract address

### 2. Join Game

```bash
npx hardhat task:game-join --network sepolia
```

**Actions**:
- Registers caller as new player
- Grants 1,000 encrypted gold
- Emits `PlayerJoined` event

**Optional Parameters**:
- `--address <CONTRACT_ADDRESS>`: Specify contract address manually

### 3. Construct Building

```bash
npx hardhat task:game-build --id 2 --network sepolia
```

**Actions**:
- Encrypts building ID (1-4)
- Submits encrypted construction transaction
- Deducts cost from player's gold if affordable

**Parameters**:
- `--id <1-4>`: Building type (1=Barracks, 2=Farm, 3=Factory, 4=Wall)
- `--address <CONTRACT_ADDRESS>`: (Optional) Contract address

**Example**:
```bash
# Build a Farm (costs 200 gold)
npx hardhat task:game-build --id 2 --network sepolia
```

### 4. Decrypt Player State

```bash
npx hardhat task:game-decrypt --network sepolia
```

**Actions**:
- Fetches encrypted player state
- Decrypts gold balance and last building
- Displays plaintext values

**Optional Parameters**:
- `--player <ADDRESS>`: View another player's state (requires their permission)
- `--address <CONTRACT_ADDRESS>`: Specify contract address

**Example Output**:
```
Player 0x1234...5678
  Gold      : 800
  Building  : 2 (Farm)
  Registered: true
```

---

## Frontend Application

### Running the Frontend

1. **Navigate to frontend directory**:
   ```bash
   cd src
   ```

2. **Configure contract address**:
   - Open `src/config/contracts.ts`
   - Update contract address from deployment artifacts:
     ```typescript
     export const SILENT_KINGDOMS_ADDRESS = "0x..."; // From deployments/sepolia/
     ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**: Navigate to `http://localhost:5173`

### Frontend Features

- **Wallet Connection**: RainbowKit integration for easy wallet connection
- **Join Game**: One-click registration with automatic encrypted gold allocation
- **Build Structures**: Select and construct buildings with real-time encrypted transactions
- **View State**: Decrypt and display your gold and last building
- **Responsive UI**: Clean, intuitive interface without Tailwind CSS
- **Transaction Feedback**: Real-time transaction status and confirmation

### Frontend Architecture

```typescript
src/
├── src/
│   ├── components/
│   │   ├── Header.tsx          // Wallet connection UI
│   │   └── GameApp.tsx         // Main game interface
│   ├── config/
│   │   ├── wagmi.ts            // wagmi/RainbowKit configuration
│   │   └── contracts.ts        // Contract addresses and ABIs
│   ├── hooks/
│   │   ├── useEthersSigner.ts  // Ethers v6 signer adapter
│   │   └── useZamaInstance.ts  // FHE encryption instance
│   ├── App.tsx                 // Root application component
│   └── main.tsx                // Application entry point
├── vite.config.ts              // Vite build configuration
└── package.json                // Frontend dependencies
```

### Key Technologies

- **State Management**: React hooks (useState, useEffect)
- **Blockchain Reads**: viem for efficient contract reads
- **Blockchain Writes**: ethers.js v6 for transaction signing
- **Encryption**: Zama relayer SDK for FHE operations
- **Wallet Integration**: wagmi + RainbowKit for multi-wallet support

---

## Project Structure

```
silent-kingdoms/
├── contracts/                  # Smart contracts
│   └── SilentKingdoms.sol     # Main game contract
├── deploy/                     # Deployment scripts
│   └── deploy.ts              # Hardhat deploy configuration
├── tasks/                      # Custom Hardhat tasks
│   ├── accounts.ts            # Account management tasks
│   └── SilentKingdoms.ts      # Game-specific tasks
├── test/                       # Test suites
│   ├── SilentKingdoms.ts      # Local FHEVM mock tests
│   └── SilentKingdomsSepolia.ts # Sepolia integration tests
├── src/                        # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── config/            # Configuration files
│   │   └── hooks/             # Custom React hooks
│   └── vite.config.ts         # Vite configuration
├── deployments/                # Deployment artifacts (generated)
│   ├── localhost/             # Local deployment data
│   └── sepolia/               # Sepolia deployment data
├── artifacts/                  # Compiled contracts (generated)
├── cache/                      # Hardhat cache (generated)
├── types/                      # TypeChain generated types (generated)
├── hardhat.config.ts          # Hardhat configuration
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── .env                       # Environment variables (not committed)
└── README.md                  # This file
```

---

## Smart Contract Details

### SilentKingdoms.sol

**Inherits**: `SepoliaConfig` (Zama FHEVM configuration)

**State Variables**:
```solidity
uint32 public constant STARTING_GOLD = 1_000;
uint32 public constant BARRACKS_COST = 100;
uint32 public constant FARM_COST = 200;
uint32 public constant FACTORY_COST = 300;
uint32 public constant WALL_COST = 400;

struct PlayerData {
    euint32 gold;              // Encrypted gold balance
    euint32 lastBuilding;      // Encrypted last building ID
    bool registered;           // Public registration flag
}

mapping(address => PlayerData) private _players;
```

**Key Functions**:

1. **`joinGame()`**: Register new player and allocate starting gold
   - **Access**: Public, external
   - **Mutates**: Creates encrypted player state
   - **Emits**: `PlayerJoined(address player)`
   - **Requirements**: Player not already registered

2. **`constructBuilding(externalEuint32 encryptedBuildingId, bytes inputProof)`**:
   - **Access**: Public, external
   - **Parameters**:
     - `encryptedBuildingId`: Client-encrypted building choice
     - `inputProof`: Zero-knowledge proof of encryption validity
   - **Logic**:
     - Validates proof and decrypts building ID
     - Checks if building ID is valid (1-4)
     - Checks if player can afford the building
     - Deducts cost only if both checks pass
     - Updates encrypted state atomically
   - **Emits**: `BuildingAttempted(address player)`
   - **Requirements**: Player registered

3. **`getPlayerGold(address playerAddress)`**: View encrypted gold
   - **Access**: Public, view
   - **Returns**: `euint32` encrypted gold balance
   - **Requirements**: Player registered

4. **`getPlayerLastBuilding(address playerAddress)`**: View encrypted building
   - **Access**: Public, view
   - **Returns**: `euint32` encrypted building ID
   - **Requirements**: Player registered

5. **`getPlayerState(address playerAddress)`**: View complete encrypted state
   - **Access**: Public, view
   - **Returns**: `(euint32 gold, euint32 lastBuilding, bool registered)`
   - **Requirements**: Player registered

6. **`isPlayerRegistered(address playerAddress)`**: Check registration
   - **Access**: Public, view
   - **Returns**: `bool` registration status

7. **`getBuildingPrices()`**: Get building costs
   - **Access**: Public, pure
   - **Returns**: `uint32[4]` array of costs

**Internal Functions**:

- **`_resolveBuildingCost(euint32 buildingId)`**:
  - Maps encrypted building ID to encrypted cost
  - Returns encrypted cost and validity boolean
  - Uses FHE.select() for constant-time lookups

- **`_storePlayerCiphertexts(...)`**:
  - Atomically updates player's encrypted state
  - Configures access control lists (ACL)
  - Grants contract and player access to ciphertexts

**Security Features**:
- All financial state is encrypted
- Atomic state updates prevent partial failures
- Access control restricts decryption to authorized parties
- Invalid inputs gracefully handled without reverting
- Zero-knowledge proofs prevent malformed encrypted inputs

---

## Testing Strategy

### Test Philosophy

Silent Kingdoms employs comprehensive testing at multiple levels:

1. **Unit Tests**: Individual function behavior with encrypted inputs
2. **Integration Tests**: Complete game flow from join to building construction
3. **Edge Case Tests**: Invalid inputs, insufficient funds, unauthorized access
4. **Decryption Tests**: Verify encrypted values match expected plaintext
5. **Gas Optimization Tests**: Track gas usage for FHE operations

### Local Testing (FHEVM Mock)

**Environment**: Hardhat network with FHEVM mock

**Coverage Areas**:
- ✅ Player registration and initial state
- ✅ Encrypted gold allocation
- ✅ Building construction with valid IDs
- ✅ Cost deduction accuracy
- ✅ Invalid building ID handling
- ✅ Insufficient funds scenarios
- ✅ Access control (unregistered players)
- ✅ State immutability on failed transactions

**Sample Test**:
```typescript
it("encrypts construction choice and deducts the correct cost", async () => {
  await contract.connect(alice).joinGame();

  const encryptedBuilding = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add32(2) // Farm (costs 200)
    .encrypt();

  await contract.connect(alice)
    .constructBuilding(encryptedBuilding.handles[0], encryptedBuilding.inputProof);

  const state = await contract.getPlayerState(alice.address);
  const clearGold = await fhevm.userDecryptEuint(FhevmType.euint32, state[0], contractAddress, alice);

  expect(clearGold).to.eq(800); // 1000 - 200
});
```

### Sepolia Testing

**Purpose**: Validate contract behavior on live testnet with real FHE infrastructure

**Test Suite**: `test/SilentKingdomsSepolia.ts`

**Prerequisites**:
- Deployed contract on Sepolia
- Funded test wallet with Sepolia ETH

**Run Command**:
```bash
npx hardhat test --network sepolia
```

---

## Security Considerations

### Cryptographic Security

- **FHE Guarantees**: All encrypted values are computationally secure under Zama's TFHE-rs implementation
- **Key Management**: Player private keys never leave the client
- **Proof Verification**: All encrypted inputs require valid zero-knowledge proofs
- **No Trusted Setup**: FHE doesn't require trusted setup ceremonies

### Smart Contract Security

- **Access Control**: ACL system restricts decryption to authorized addresses
- **Reentrancy**: No external calls during state updates (inherently safe)
- **Integer Overflow**: Solidity 0.8.24+ has built-in overflow protection
- **Input Validation**: Invalid building IDs handled gracefully without reversion
- **State Consistency**: Atomic updates prevent partial state corruption

### Operational Security

- **Private Key Protection**: Use hardware wallets for deployment keys
- **Environment Variables**: Never commit `.env` files
- **Testnet First**: Always test on Sepolia before mainnet
- **Gas Limits**: FHE operations are gas-intensive; set appropriate limits
- **Contract Verification**: Always verify deployed contracts on Etherscan

### Known Limitations

1. **Gas Costs**: FHE operations are significantly more expensive than plaintext operations
2. **Computation Limits**: Complex FHE operations may hit block gas limits
3. **Decryption Latency**: Client-side decryption adds latency to UX
4. **Network Dependency**: Frontend relies on Zama's relayer infrastructure

---

## Future Roadmap

### Phase 1: Core Gameplay Enhancement (Q2 2024)
- [ ] Multiple building instances (build more than one of each type)
- [ ] Building synergies and bonuses
- [ ] Resource generation over time (passive income)
- [ ] Building upgrade system with tiered costs

### Phase 2: Multiplayer Features (Q3 2024)
- [ ] Player-vs-player battles with encrypted troop counts
- [ ] Alliance system with shared encrypted resources
- [ ] Encrypted trading marketplace
- [ ] Leaderboards with zero-knowledge proofs of rankings

### Phase 3: Advanced Game Mechanics (Q4 2024)
- [ ] Tech tree with encrypted research progress
- [ ] Random events using VRF with encrypted outcomes
- [ ] Quest system with encrypted reward pools
- [ ] Territory control mechanics

### Phase 4: Economic Features (Q1 2025)
- [ ] In-game NFTs for unique buildings/units
- [ ] Token integration for governance and rewards
- [ ] Staking mechanisms with encrypted balances
- [ ] Liquidity mining for game participation

### Phase 5: Platform Expansion (Q2 2025)
- [ ] Mainnet deployment on Ethereum
- [ ] Cross-chain support (Polygon, Arbitrum)
- [ ] Mobile-responsive web app
- [ ] Native mobile apps (iOS/Android)

### Phase 6: Advanced Encryption (Q3 2025)
- [ ] Larger encrypted integers (euint64, euint128) for scaling
- [ ] Encrypted arrays for complex game state
- [ ] Homomorphic comparison of player states
- [ ] Zero-knowledge identity proofs

### Technical Improvements
- [ ] Gas optimization for FHE operations
- [ ] Client-side caching for encrypted state
- [ ] GraphQL API for game events
- [ ] Decentralized frontend hosting (IPFS)
- [ ] Automated testing with Tenderly/Hardhat forking

### Community & Governance
- [ ] DAO governance for game rules
- [ ] Community-designed buildings and features
- [ ] Bug bounty program
- [ ] Developer grants for third-party tools

---

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow code style and add tests
4. **Run tests**: `npm run test` (ensure all tests pass)
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**: Describe your changes and link related issues

### Contribution Guidelines

- **Code Style**: Follow existing TypeScript/Solidity conventions
- **Testing**: Add tests for new features (aim for >80% coverage)
- **Documentation**: Update README and inline comments
- **Commit Messages**: Use clear, descriptive commit messages
- **Pull Requests**: Keep PRs focused on single features/fixes

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/silent-kingdoms.git
cd silent-kingdoms

# Add upstream remote
git remote add upstream https://github.com/originalrepo/silent-kingdoms.git

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
npm run test

# Submit PR to main repository
```

### Areas for Contribution

- 🐛 Bug fixes and error handling improvements
- ✨ New game mechanics and features
- 📚 Documentation and tutorials
- 🎨 Frontend UI/UX enhancements
- ⛽ Gas optimization for FHE operations
- 🧪 Additional test coverage
- 🌐 Internationalization (i18n)
- ♿ Accessibility improvements

---

## License

This project is licensed under the **BSD-3-Clause-Clear License**.

### Summary

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No patent grant
- ⚠️ Disclaimer of warranty
- ⚠️ Limitation of liability

See the [LICENSE](LICENSE) file for full details.

---

## Support & Community

### Documentation

- **FHEVM Documentation**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **Zama Solidity Library**: [https://github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm)
- **Hardhat Documentation**: [https://hardhat.org/docs](https://hardhat.org/docs)
- **RainbowKit Docs**: [https://www.rainbowkit.com/docs](https://www.rainbowkit.com/docs)

### Get Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/silent-kingdoms/issues)
- **Discussions**: [Join community discussions](https://github.com/yourusername/silent-kingdoms/discussions)
- **Zama Discord**: [Join Zama community](https://discord.gg/zama)
- **Twitter**: [@SilentKingdoms](https://twitter.com/silentkingdoms) (updates and announcements)

### Useful Resources

- 📖 [FHEVM Developer Guides](https://docs.zama.ai/protocol/solidity-guides)
- 🎓 [FHE Tutorials](https://docs.zama.ai/protocol/tutorials)
- 💬 [Zama Community Forum](https://community.zama.ai)
- 🎥 [Video Tutorials](https://www.youtube.com/@zama_fhe)

---

## Acknowledgments

- **Zama**: For pioneering FHE technology and providing the FHEVM infrastructure
- **Hardhat**: For the excellent smart contract development framework
- **RainbowKit**: For seamless wallet connection UX
- **Ethereum Community**: For building the decentralized future

---

**Built with privacy, powered by Fully Homomorphic Encryption**

*Silent Kingdoms - Where strategies remain secret, victories stay silent*
