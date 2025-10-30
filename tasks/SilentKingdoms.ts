import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const BUILDING_LABELS: Record<number, string> = {
  0: "None",
  1: "Barracks",
  2: "Farm",
  3: "Factory",
  4: "Wall",
};

task("task:game-address", "Prints the SilentKingdoms address").setAction(async function (_taskArguments, hre) {
  const { deployments } = hre;
  const silentKingdoms = await deployments.get("SilentKingdoms");

  console.log(`SilentKingdoms address is ${silentKingdoms.address}`);
});

task("task:game-join", "Calls joinGame() on SilentKingdoms")
  .addOptionalParam("address", "Optionally specify the SilentKingdoms contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers } = hre;

    const silentKingdomsDeployment = taskArguments.address
      ? { address: taskArguments.address as string }
      : await deployments.get("SilentKingdoms");

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("SilentKingdoms", silentKingdomsDeployment.address);

    const tx = await contract.connect(signers[0]).joinGame();
    console.log(`joinGame tx submitted: ${tx.hash}`);
    await tx.wait();
    console.log("Player joined successfully");
  });

task("task:game-build", "Encrypts a building id and constructs it")
  .addParam("id", "Building id (1-4)")
  .addOptionalParam("address", "Optionally specify the SilentKingdoms contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    const buildingId = parseInt(taskArguments.id as string, 10);
    if (!Number.isInteger(buildingId) || buildingId < 1 || buildingId > 4) {
      throw new Error("--id must be an integer between 1 and 4");
    }

    await fhevm.initializeCLIApi();

    const silentKingdomsDeployment = taskArguments.address
      ? { address: taskArguments.address as string }
      : await deployments.get("SilentKingdoms");

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contract = await ethers.getContractAt("SilentKingdoms", silentKingdomsDeployment.address);

    const encryptedBuilding = await fhevm
      .createEncryptedInput(silentKingdomsDeployment.address, signer.address)
      .add32(buildingId)
      .encrypt();

    const tx = await contract
      .connect(signer)
      .constructBuilding(encryptedBuilding.handles[0], encryptedBuilding.inputProof);

    console.log(`constructBuilding tx submitted: ${tx.hash}`);
    await tx.wait();
    console.log(`Construction attempt recorded for building id ${buildingId}`);
  });

task("task:game-decrypt", "Decrypts player gold and last building")
  .addOptionalParam("address", "Optionally specify the SilentKingdoms contract address")
  .addOptionalParam("player", "Player address to inspect")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const silentKingdomsDeployment = taskArguments.address
      ? { address: taskArguments.address as string }
      : await deployments.get("SilentKingdoms");

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const playerAddress = (taskArguments.player as string | undefined) ?? signer.address;

    const contract = await ethers.getContractAt("SilentKingdoms", silentKingdomsDeployment.address);

    const state = await contract.getPlayerState(playerAddress);

    const clearGold = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      state[0],
      silentKingdomsDeployment.address,
      signer,
    );

    const clearBuilding = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      state[1],
      silentKingdomsDeployment.address,
      signer,
    );

    const buildingLabel = BUILDING_LABELS[Number(clearBuilding)] ?? "Unknown";

    console.log(`Player ${playerAddress}`);
    console.log(`  Gold      : ${clearGold}`);
    console.log(`  Building  : ${clearBuilding} (${buildingLabel})`);
    console.log(`  Registered: ${state[2]}`);
  });
