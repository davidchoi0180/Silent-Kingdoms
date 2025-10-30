import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useReadContract } from 'wagmi';
import type { Address } from 'viem';

import { Header } from './Header';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { BUILDINGS, CONTRACT_ABI, CONTRACT_ADDRESS, ZERO_ADDRESS } from '../config/contracts';
import '../styles/GameApp.css';

type DecryptedState = {
  gold: number;
  buildingId: number;
};

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const DEFAULT_PRICES = [100, 200, 300, 400];

function formatCiphertext(value?: string | null) {
  if (!value) {
    return 'Not available';
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function buildingNameFromId(id: number) {
  const found = BUILDINGS.find((entry) => entry.id === id);
  if (found) {
    return found.name;
  }
  if (id === 0) {
    return 'None';
  }
  return 'Unknown';
}

function normaliseCiphertext(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }

  return undefined;
}

export function GameApp() {
  const { address: walletAddress, isConnected } = useAccount();
  const signer = useEthersSigner();
  const { instance, isLoading: isInstanceLoading, error: instanceError } = useZamaInstance();

  const [gameAddress, setGameAddress] = useState<Address>(CONTRACT_ADDRESS);
  const [customAddress, setCustomAddress] = useState<string>(CONTRACT_ADDRESS);
  const [activeTab, setActiveTab] = useState<'status' | 'build'>('status');
  const [isJoining, setIsJoining] = useState(false);
  const [pendingBuildId, setPendingBuildId] = useState<number | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedState, setDecryptedState] = useState<DecryptedState | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'info' | 'error'; message: string } | null>(null);

  const hasConfiguredContract = gameAddress !== ZERO_ADDRESS;
  const isCustomAddressValid = ADDRESS_PATTERN.test(customAddress);

  useEffect(() => {
    setDecryptedState(null);
  }, [walletAddress, gameAddress]);

  const {
    data: registrationData,
    isFetching: isCheckingRegistration,
    refetch: refetchRegistration,
  } = useReadContract({
    address: gameAddress,
    abi: CONTRACT_ABI,
    functionName: 'isPlayerRegistered',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: isConnected && hasConfiguredContract && !!walletAddress,
    },
  });

  const isRegistered = registrationData === true;

  const {
    data: playerState,
    isFetching: isFetchingState,
    refetch: refetchPlayerState,
  } = useReadContract({
    address: gameAddress,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerState',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: isConnected && hasConfiguredContract && isRegistered && !!walletAddress,
    },
  });

  const { data: buildingPricesData } = useReadContract({
    address: gameAddress,
    abi: CONTRACT_ABI,
    functionName: 'getBuildingPrices',
    query: {
      enabled: hasConfiguredContract,
    },
  });

  const buildingPrices = useMemo(() => {
    if (!buildingPricesData) {
      return DEFAULT_PRICES;
    }

    return Array.from(buildingPricesData as readonly (bigint | number)[]).map((value, index) => {
      const numericValue = typeof value === 'bigint' ? Number(value) : value;
      return Number.isFinite(numericValue) ? numericValue : DEFAULT_PRICES[index] ?? 0;
    });
  }, [buildingPricesData]);

  const buildingOptions = useMemo(
    () =>
      BUILDINGS.map((building, index) => ({
        ...building,
        cost: buildingPrices[index] ?? DEFAULT_PRICES[index] ?? 0,
      })),
    [buildingPrices],
  );

  const encryptedGold = normaliseCiphertext(playerState?.[0]);
  const encryptedBuilding = normaliseCiphertext(playerState?.[1]);

  const setInfo = (message: string) => setFeedback({ type: 'info', message });
  const setError = (message: string) => setFeedback({ type: 'error', message });

  const applyContractAddress = () => {
    if (!isCustomAddressValid) {
      setError('Enter a valid 42-character hexadecimal address.');
      return;
    }

    setGameAddress(customAddress as Address);
    setDecryptedState(null);
    setFeedback({ type: 'info', message: 'Contract address updated.' });
  };

  const handleJoinGame = async () => {
    if (!hasConfiguredContract) {
      setError('Configure the contract address before joining the game.');
      return;
    }

    if (!walletAddress) {
      setError('Connect your wallet to join the game.');
      return;
    }

    const resolvedSigner = await signer;
    if (!resolvedSigner) {
      setError('Unable to access wallet signer.');
      return;
    }

    setIsJoining(true);
    setFeedback(null);

    try {
      const contract = new ethers.Contract(gameAddress, CONTRACT_ABI, resolvedSigner);
      const tx = await contract.joinGame();
      setInfo('Transaction sent. Waiting for confirmation...');
      await tx.wait();
      setInfo('Welcome to Silent Kingdoms! Refreshing your state.');
      await Promise.all([refetchRegistration(), refetchPlayerState()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join the game';
      setError(message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleBuild = async (buildingId: number) => {
    if (!hasConfiguredContract) {
      setError('Configure the contract address before constructing buildings.');
      return;
    }

    if (!walletAddress) {
      setError('Connect your wallet to construct buildings.');
      return;
    }

    if (!instance) {
      setError('Encryption service is not ready yet.');
      return;
    }

    const resolvedSigner = await signer;
    if (!resolvedSigner) {
      setError('Unable to access wallet signer.');
      return;
    }

    try {
      setPendingBuildId(buildingId);
      setFeedback(null);

      const buffer = instance.createEncryptedInput(gameAddress, walletAddress);
      buffer.add32(buildingId);
      const encryptedInput = await buffer.encrypt();

      const contract = new ethers.Contract(gameAddress, CONTRACT_ABI, resolvedSigner);
      const tx = await contract.constructBuilding(encryptedInput.handles[0], encryptedInput.inputProof);
      setInfo('Encrypted construction submitted. Waiting for confirmation...');
      await tx.wait();
      setInfo('Construction recorded. Updating your encrypted state.');
      setDecryptedState(null);
      await refetchPlayerState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to construct the selected building';
      setError(message);
    } finally {
      setPendingBuildId(null);
    }
  };

  const handleDecrypt = async () => {
    if (!instance) {
      setError('Encryption instance is not ready.');
      return;
    }

    if (!walletAddress) {
      setError('Connect your wallet to decrypt your state.');
      return;
    }

    if (!encryptedGold || !encryptedBuilding) {
      setError('No encrypted data available to decrypt. Join the game first.');
      return;
    }

    const resolvedSigner = await signer;
    if (!resolvedSigner) {
      setError('Unable to access wallet signer.');
      return;
    }

    setIsDecrypting(true);
    setFeedback(null);

    try {
      const keypair = instance.generateKeypair();
      const handleContractPairs = [
        { handle: encryptedGold, contractAddress: gameAddress },
        { handle: encryptedBuilding, contractAddress: gameAddress },
      ];
      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [gameAddress];

      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimestamp, durationDays);

      const signature = await resolvedSigner.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message,
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        walletAddress,
        startTimestamp,
        durationDays,
      );

      const goldHandle = handleContractPairs[0].handle;
      const buildingHandle = handleContractPairs[1].handle;

      const goldValue = Number(result[goldHandle]);
      const buildingValue = Number(result[buildingHandle]);

      setDecryptedState({ gold: goldValue, buildingId: buildingValue });
      setInfo('Decryption successful. Values will remain visible until you hide them.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decrypt encrypted state';
      setError(message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const clearDecryptedState = () => {
    setDecryptedState(null);
    setFeedback(null);
  };

  const isDecryptDisabled =
    !instance || !walletAddress || !encryptedGold || !encryptedBuilding || isDecrypting || !hasConfiguredContract;

  const joinDisabled =
    !hasConfiguredContract || !walletAddress || isJoining || isCheckingRegistration || isRegistered || !isConnected;

  const contractWarning = !hasConfiguredContract
    ? 'Set the deployed contract address before interacting with the game.'
    : null;

  return (
    <div className="game-app">
      <Header />
      <main className="game-main">
        <section className="game-card contract-panel">
          <label htmlFor="contract-address">Contract on Sepolia</label>
          <div className="contract-input-row">
            <input
              id="contract-address"
              value={customAddress}
              onChange={(event) => setCustomAddress(event.target.value)}
              placeholder="0x..."
            />
            <div className="actions-row">
              <button
                className="secondary-button"
                type="button"
                onClick={applyContractAddress}
                disabled={!isCustomAddressValid}
              >
                Apply Address
              </button>
              <span className="helper-text">
                The address defaults to zero. Replace it with the deployed SilentKingdoms address on Sepolia.
              </span>
            </div>
            {contractWarning ? <p className="helper-text">⚠️ {contractWarning}</p> : null}
          </div>
        </section>

        <section className="game-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Player Overview</h2>
              <p className="card-description">
                Manage your encrypted gold and discover which structures you have secretly built.
              </p>
            </div>
            <div>
              {isConnected ? (
                <span className={`status-badge ${isRegistered ? '' : 'pending'}`}>
                  {isRegistered ? 'Registered adventurer' : 'Registration required'}
                </span>
              ) : (
                <span className="status-badge alert">Connect wallet</span>
              )}
            </div>
          </div>

          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Encrypted Gold</span>
              <p className="status-value">{formatCiphertext(encryptedGold)}</p>
            </div>
            <div className="status-item">
              <span className="status-label">Encrypted Building</span>
              <p className="status-value">{formatCiphertext(encryptedBuilding)}</p>
            </div>
            <div className="status-item">
              <span className="status-label">Decrypted Overview</span>
              {decryptedState ? (
                <div className="status-value">
                  <strong>{decryptedState.gold}</strong> gold — {buildingNameFromId(decryptedState.buildingId)}
                </div>
              ) : (
                <p className="status-value">Hidden. Decrypt to reveal your holdings.</p>
              )}
            </div>
          </div>

          <div className="actions-row">
            <button
              className="primary-button"
              type="button"
              onClick={handleJoinGame}
              disabled={joinDisabled}
            >
              {isJoining ? 'Joining...' : isRegistered ? 'Already joined' : 'Join Silent Kingdoms'}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleDecrypt}
              disabled={isDecryptDisabled}
            >
              {isDecrypting ? 'Decrypting...' : 'Decrypt my state'}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={clearDecryptedState}
              disabled={!decryptedState}
            >
              Hide decrypted data
            </button>
          </div>

          <div className="helper-text">
            {isFetchingState
              ? 'Refreshing encrypted data...'
              : isCheckingRegistration
              ? 'Checking registration status...'
              : null}
            {isInstanceLoading ? ' Initialising encryption service...' : null}
            {instanceError ? ` Encryption error: ${instanceError}` : null}
          </div>
        </section>

        <div className="tab-navigation">
          <nav className="tab-nav">
            <button
              className={`tab-button ${activeTab === 'status' ? 'active' : 'inactive'}`}
              type="button"
              onClick={() => setActiveTab('status')}
            >
              Player status
            </button>
            <button
              className={`tab-button ${activeTab === 'build' ? 'active' : 'inactive'}`}
              type="button"
              onClick={() => setActiveTab('build')}
            >
              Construct buildings
            </button>
          </nav>
        </div>

        {activeTab === 'status' ? (
          <section className="game-card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Encrypted resources</h2>
                <p className="card-description">
                  Every balance and decision is protected by Zama FHE. Decrypt locally to plan your next move.
                </p>
              </div>
            </div>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Wallet</span>
                <p className="status-value">{walletAddress ?? 'Not connected'}</p>
              </div>
              <div className="status-item">
                <span className="status-label">Registration</span>
                <p className="status-value">{isRegistered ? 'Joined the kingdom' : 'Awaiting enlistment'}</p>
              </div>
              <div className="status-item">
                <span className="status-label">Encryption Service</span>
                <p className="status-value">
                  {instance ? 'Ready for relayer operations' : 'Initialising...'}
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="game-card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Construction choices</h2>
                <p className="card-description">
                  Encrypt your building plan, spend gold, and reveal it only when you choose.
                </p>
              </div>
            </div>

            {isRegistered ? (
              <div className="building-grid">
                {buildingOptions.map((building) => (
                  <article key={building.id} className="building-card">
                    <div className="building-header">
                      <span className="building-name">{building.name}</span>
                      <span className="building-cost">{building.cost} gold</span>
                    </div>
                    <p className="helper-text">
                      Encrypts building id {building.id} and updates your resources privately.
                    </p>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => handleBuild(building.id)}
                      disabled={Boolean(pendingBuildId) || !hasConfiguredContract || !walletAddress}
                    >
                      {pendingBuildId === building.id ? 'Constructing...' : 'Construct with FHE'}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>Join the kingdom first</strong>
                <span>Once enlisted you can plan encrypted constructions for your empire.</span>
              </div>
            )}
          </section>
        )}

        {feedback ? (
          <div className={`tx-banner ${feedback.type === 'error' ? 'error' : ''}`}>{feedback.message}</div>
        ) : null}
      </main>
    </div>
  );
}
