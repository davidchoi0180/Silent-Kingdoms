import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedSilentKingdoms = await deploy("SilentKingdoms", {
    from: deployer,
    log: true,
  });

  console.log(`SilentKingdoms contract: `, deployedSilentKingdoms.address);
};
export default func;
func.id = "deploy_silentKingdoms"; // id required to prevent reexecution
func.tags = ["SilentKingdoms"];
