const hre = require("hardhat");

async function main() {

  const FoodTrace = await hre.ethers.getContractFactory("FoodTrace");

  const foodTrace = await FoodTrace.deploy();

  await foodTrace.deployed();

  console.log("FoodTrace deployed to:", foodTrace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
