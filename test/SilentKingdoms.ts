import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { SilentKingdoms, SilentKingdoms__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SilentKingdoms")) as SilentKingdoms__factory;
  const silentKingdomsContract = (await factory.deploy()) as SilentKingdoms;
  const silentKingdomsAddress = await silentKingdomsContract.getAddress();

  return { silentKingdomsContract, silentKingdomsAddress };
}

describe("SilentKingdoms", function () {
  let signers: Signers;
  let silentKingdomsContract: SilentKingdoms;
  let silentKingdomsAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This Hardhat test suite requires the FHEVM mock environment");
      this.skip();
    }

    ({ silentKingdomsContract, silentKingdomsAddress } = await deployFixture());
  });

  it("grants encrypted starting gold when a player joins", async function () {
    await silentKingdomsContract.connect(signers.alice).joinGame();

    const state = await silentKingdomsContract.getPlayerState(signers.alice.address);

    const clearGold = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      state[0],
      silentKingdomsAddress,
      signers.alice,
    );

    expect(clearGold).to.eq(1_000);
    expect(state[2]).to.eq(true);
  });

  it("encrypts construction choice and deducts the correct cost", async function () {
    await silentKingdomsContract.connect(signers.alice).joinGame();

    const encryptedBuilding = await fhevm
      .createEncryptedInput(silentKingdomsAddress, signers.alice.address)
      .add32(2) // Farm
      .encrypt();

    await silentKingdomsContract
      .connect(signers.alice)
      .constructBuilding(encryptedBuilding.handles[0], encryptedBuilding.inputProof);

    const state = await silentKingdomsContract.getPlayerState(signers.alice.address);

    const clearGold = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      state[0],
      silentKingdomsAddress,
      signers.alice,
    );

    const clearBuilding = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      state[1],
      silentKingdomsAddress,
      signers.alice,
    );

    expect(clearGold).to.eq(800);
    expect(clearBuilding).to.eq(2);
  });

  it("reverts when constructing before joining", async function () {
    const encryptedBuilding = await fhevm
      .createEncryptedInput(silentKingdomsAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await expect(
      silentKingdomsContract
        .connect(signers.alice)
        .constructBuilding(encryptedBuilding.handles[0], encryptedBuilding.inputProof),
    ).to.be.revertedWith("Player not registered");
  });

  it("ignores invalid building ids without changing state", async function () {
    await silentKingdomsContract.connect(signers.alice).joinGame();

    const encryptedInvalid = await fhevm
      .createEncryptedInput(silentKingdomsAddress, signers.alice.address)
      .add32(7)
      .encrypt();

    await silentKingdomsContract
      .connect(signers.alice)
      .constructBuilding(encryptedInvalid.handles[0], encryptedInvalid.inputProof);

    const state = await silentKingdomsContract.getPlayerState(signers.alice.address);

    const clearGold = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      state[0],
      silentKingdomsAddress,
      signers.alice,
    );

    const clearBuilding = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      state[1],
      silentKingdomsAddress,
      signers.alice,
    );

    expect(clearGold).to.eq(1_000);
    expect(clearBuilding).to.eq(0);
  });
});
