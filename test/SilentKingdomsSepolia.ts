import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm, deployments } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { SilentKingdoms } from "../types";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("SilentKingdomsSepolia", function () {
  let signers: Signers;
  let silentKingdomsContract: SilentKingdoms;
  let silentKingdomsAddress: string;
  let step = 0;
  let steps = 0;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn("This Hardhat test suite can only run on Sepolia Testnet");
      this.skip();
    }

    try {
      const deployment = await deployments.get("SilentKingdoms");
      silentKingdomsAddress = deployment.address;
      silentKingdomsContract = await ethers.getContractAt("SilentKingdoms", deployment.address);
    } catch (error) {
      (error as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw error;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("joins and constructs a building", async function () {
    this.timeout(4 * 40000);
    steps = 12;

    progress("Calling joinGame()...");
    let tx = await silentKingdomsContract.connect(signers.alice).joinGame();
    await tx.wait();

    progress("Fetching encrypted state...");
    const stateAfterJoin = await silentKingdomsContract.getPlayerState(signers.alice.address);

    progress("Decrypting gold after join...");
    const goldAfterJoin = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      stateAfterJoin[0],
      silentKingdomsAddress,
      signers.alice,
    );
    expect(goldAfterJoin).to.eq(1_000);

    progress("Encrypting building id 1...");
    const encryptedBuilding = await fhevm
      .createEncryptedInput(silentKingdomsAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    progress("Calling constructBuilding()...");
    tx = await silentKingdomsContract
      .connect(signers.alice)
      .constructBuilding(encryptedBuilding.handles[0], encryptedBuilding.inputProof);
    await tx.wait();

    progress("Fetching encrypted state after construction...");
    const stateAfterBuild = await silentKingdomsContract.getPlayerState(signers.alice.address);

    progress("Decrypting gold after construction...");
    const goldAfterBuild = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      stateAfterBuild[0],
      silentKingdomsAddress,
      signers.alice,
    );

    progress("Decrypting building id...");
    const buildingId = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      stateAfterBuild[1],
      silentKingdomsAddress,
      signers.alice,
    );

    expect(goldAfterBuild).to.eq(900);
    expect(buildingId).to.eq(1);
  });
});
