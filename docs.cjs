const scriptName = process.argv[2];

const getDocs = () => {
  switch (scriptName) {
    case "prettier":
      return "Prettify all local files using prettier";
      break;
    case "build":
      return "Compiles the project using yarns plugin builder";
      break;
  }
};

if (getDocs()) {
  console.log("\n\n >", getDocs(), "\n\n");
}
